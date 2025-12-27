"use server";

import { generateText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { logChatInteraction } from "@/lib/ai/services/audit-logger";

// Public fields whitelist for products (PermissionManager - Output Level)
const PUBLIC_PRODUCT_FIELDS = {
    id: true,
    name: true,
    description: true,
    price: true,
    images: true,
    quantity: true,
    categoryRef: { select: { name: true, slug: true } },
    brandRef: { select: { name: true } },
    store: { select: { name: true, username: true } },
};

// Public fields for vouchers
const PUBLIC_VOUCHER_FIELDS = {
    name: true,
    description: true,
    voucher_code: true,
    voucher_type: true,
    discount_type: true,
    discount_value: true,
    max_discount_amount: true,
    min_order_value: true,
    start_date: true,
    end_date: true,
};

// Schema for intent extraction - simplified to just extract search keywords
const IntentSchema = z.object({
    intent: z.enum(["SEARCH_PRODUCTS", "CHECK_PROMOTIONS", "GENERAL_CHAT"]).describe(
        "The user's intent: SEARCH_PRODUCTS for product queries, CHECK_PROMOTIONS for deals/vouchers, GENERAL_CHAT for other questions"
    ),
    searchParams: z.object({
        keywords: z.array(z.string()).describe("Key search terms extracted from the message (product names, brands, categories, descriptors). Extract meaningful words only, no filler words."),
        minPrice: z.number().describe("Minimum price filter, 0 if not specified"),
        maxPrice: z.number().describe("Maximum price filter, 0 if not specified"),
        limit: z.number().describe("Number of results to return, default 5"),
    }).describe("Search parameters extracted from the user message"),
});

/**
 * Step 1: Extract intent and search parameters from user message using AI
 */
async function extractIntent(message, history = []) {
    try {
        const result = await generateObject({
            model: google("gemini-2.0-flash"),
            schema: IntentSchema,
            prompt: `Analyze this user message and extract the intent and search keywords.

Previous conversation:
${history.map(m => `${m.role}: ${m.content}`).join('\n')}

Current user message: "${message}"

Extract:
1. The user's intent (SEARCH_PRODUCTS, CHECK_PROMOTIONS, or GENERAL_CHAT)
2. If searching for products, extract meaningful keywords including:
   - Product names (e.g., "iPhone", "laptop", "shoes")
   - Brand names (e.g., "Apple", "Samsung", "Nike")
   - Category names (e.g., "electronics", "clothing", "sports")
   - Descriptors (e.g., "gaming", "wireless", "running")
3. Price range if mentioned
4. Default limit to 5 products unless user asks for more/less

Examples:
- "Show me Apple products" → keywords: ["Apple"]
- "Find gaming laptops under $1000" → keywords: ["gaming", "laptops"], maxPrice: 1000
- "Nike running shoes" → keywords: ["Nike", "running", "shoes"]
- "Cheap phones" → keywords: ["phones"]`,
        });

        return result.object;
    } catch (error) {
        console.error("Intent extraction failed:", error);
        // Fallback to simple keyword detection
        return fallbackIntentDetection(message);
    }
}

/**
 * Fallback intent detection using keywords
 */
function fallbackIntentDetection(message) {
    const lowerMessage = message.toLowerCase();

    let intent = "GENERAL_CHAT";
    if (lowerMessage.includes("product") || lowerMessage.includes("find") ||
        lowerMessage.includes("search") || lowerMessage.includes("buy") ||
        lowerMessage.includes("looking for") || lowerMessage.includes("show me")) {
        intent = "SEARCH_PRODUCTS";
    } else if (lowerMessage.includes("promo") || lowerMessage.includes("discount") ||
        lowerMessage.includes("voucher") || lowerMessage.includes("deal") ||
        lowerMessage.includes("coupon") || lowerMessage.includes("sale")) {
        intent = "CHECK_PROMOTIONS";
    }

    // Extract simple keywords for search (filter out common words)
    const stopWords = ["show", "me", "find", "get", "want", "looking", "for", "the", "a", "an", "some", "any", "please", "can", "you", "i", "product", "products", "item", "items"];
    const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));

    return {
        intent,
        searchParams: {
            keywords: words,
            minPrice: 0,
            maxPrice: 0,
            limit: 5,
        },
    };
}

/**
 * Step 2: Fetch products from database based on extracted keywords
 * Searches across: product name, description, brand name, category name, store name
 */
async function fetchProducts(searchParams) {
    const { keywords, minPrice, maxPrice, limit } = searchParams;

    const whereClause = {
        isActive: true,
        quantity: { gt: 0 },
    };

    // Build comprehensive search across all relevant fields
    if (keywords && keywords.length > 0) {
        // For each keyword, search in name, description, brand, category, and store
        whereClause.OR = keywords.flatMap(keyword => [
            { name: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
            { brandRef: { name: { contains: keyword, mode: "insensitive" } } },
            { categoryRef: { name: { contains: keyword, mode: "insensitive" } } },
            { store: { name: { contains: keyword, mode: "insensitive" } } },
        ]);
    }

    // Filter by price range
    if (minPrice > 0) {
        whereClause.price = { ...whereClause.price, gte: minPrice };
    }
    if (maxPrice > 0) {
        whereClause.price = { ...whereClause.price, lte: maxPrice };
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        select: {
            ...PUBLIC_PRODUCT_FIELDS,
            categoryId: true, // Include for promotion filtering
        },
        take: limit || 5,
        orderBy: { createdAt: "desc" },
    });

    // Extract IDs for promotion filtering
    const productIds = products.map(p => p.id);
    const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];

    const formattedProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        price: `${p.price.toLocaleString('vi-VN')} VND`,
        description: p.description.length > 150
            ? p.description.substring(0, 150) + "..."
            : p.description,
        category: p.categoryRef?.name || "Uncategorized",
        brand: p.brandRef?.name || "No brand",
        store: p.store.name,
        inStock: "In Stock",
        stockLevel: p.quantity > 10 ? "High" : p.quantity > 3 ? "Medium" : "Low",
    }));

    return {
        products: formattedProducts,
        productIds,
        categoryIds,
    };
}

/**
 * Fetch active promotions
 * @param {Object} options - Filter options
 * @param {string[]} options.productIds - Product IDs to filter applicable promotions
 * @param {string[]} options.categoryIds - Category IDs to filter applicable promotions  
 * @param {number} options.limit - Maximum number of promotions to return
 */
async function fetchPromotions({ productIds = [], categoryIds = [], limit = 10 } = {}) {
    const now = new Date();

    const whereClause = {
        status: "ACTIVE",
        start_date: { lte: now },
        end_date: { gte: now },
    };

    // If we have specific products/categories, filter promotions that apply to them
    if (productIds.length > 0 || categoryIds.length > 0) {
        whereClause.OR = [
            // Promotions specifically for these products
            ...(productIds.length > 0 ? [{ applicableProducts: { some: { id: { in: productIds } } } }] : []),
            // Promotions for these categories
            ...(categoryIds.length > 0 ? [{ applicableCategories: { some: { id: { in: categoryIds } } } }] : []),
            // Platform-wide promotions (no specific products/categories = applies to all)
            {
                AND: [
                    { applicableProducts: { none: {} } },
                    { applicableCategories: { none: {} } },
                    { voucher_type: "PLATFORM" }
                ]
            },
            // Shipping promotions (usually apply to all)
            { voucher_type: "SHIPPING" },
        ];
    }

    const promotions = await prisma.voucherCampaign.findMany({
        where: whereClause,
        select: {
            ...PUBLIC_VOUCHER_FIELDS,
            applicableProducts: { select: { name: true } },
            applicableCategories: { select: { name: true } },
        },
        take: limit,
        orderBy: { end_date: "asc" },
    });

    return promotions.map((p) => ({
        name: p.name,
        description: p.description,
        code: p.voucher_code || "Auto-applied",
        type: p.voucher_type,
        discount: p.discount_type === "PERCENTAGE"
            ? `${p.discount_value}% off`
            : `${p.discount_value.toLocaleString('vi-VN')} VND off`,
        maxDiscount: p.max_discount_amount ? `Up to ${p.max_discount_amount.toLocaleString('vi-VN')} VND` : null,
        minOrder: p.min_order_value > 0 ? `Min: ${p.min_order_value.toLocaleString('vi-VN')} VND` : "No minimum",
        validUntil: p.end_date.toLocaleDateString('vi-VN'),
        appliesTo: p.applicableProducts?.length > 0
            ? p.applicableProducts.map(pr => pr.name).join(", ")
            : p.applicableCategories?.length > 0
                ? p.applicableCategories.map(c => c.name).join(", ")
                : "All products",
    }));
}

/**
 * Step 3: Generate final response using AI with fetched data
 */
async function generateResponse(message, history, intent, data) {
    let systemPrompt = `You are a helpful shopping assistant for ShopMe, an e-commerce platform based in Vietnam.

Guidelines:
- Be friendly and conversational
- Always recommend in-stock products only
- When showing products, include price, description, and availability
- All prices are in Vietnamese Dong (VND) - always display currency as "VND" after the number (e.g., 990,000 VND)
- If a product is low stock, mention it
- Format responses in a clear, readable way with bullet points or numbered lists
- If you cannot find what the user is looking for, suggest alternatives or ask clarifying questions
`;

    if (intent === "SEARCH_PRODUCTS") {
        if (data.products && data.products.length > 0) {
            systemPrompt += `\n\nPRODUCTS FOUND (present these to the user in a friendly way):\n${JSON.stringify(data.products, null, 2)}`;
        } else {
            systemPrompt += `\n\nNo products were found matching the user's query. Apologize and suggest they try different search terms or browse categories.`;
        }
    } else if (intent === "CHECK_PROMOTIONS") {
        if (data.promotions && data.promotions.length > 0) {
            systemPrompt += `\n\nACTIVE PROMOTIONS (share these with the user):\n${JSON.stringify(data.promotions, null, 2)}`;
        } else {
            systemPrompt += `\n\nNo active promotions are currently available. Let the user know and suggest they check back later or sign up for notifications.`;
        }
    }

    const messages = [
        ...history.map((msg) => ({
            role: msg.role,
            content: msg.content,
        })),
        { role: "user", content: message },
    ];

    const result = await generateText({
        model: google("gemini-2.0-flash"),
        system: systemPrompt,
        messages,
    });

    return result.text;
}

/**
 * Main agent function to process user messages (Two-Step Approach)
 */
export async function runAgent(message, sessionId, history = [], userId = null) {
    const startTime = Date.now();
    let extractedIntent = null;
    let products = [];
    let promotions = [];

    try {
        // Validate API key
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
        }

        // Step 1: Extract intent and search parameters using AI
        console.log("Step 1: Extracting intent from user message...");
        extractedIntent = await extractIntent(message, history);
        console.log("Extracted intent:", extractedIntent);

        // Step 2: Fetch data based on intent
        console.log("Step 2: Fetching data from database...");
        const data = {};

        if (extractedIntent.intent === "SEARCH_PRODUCTS") {
            const productResult = await fetchProducts(extractedIntent.searchParams);
            products = productResult.products;
            data.products = products;
            console.log(`Found ${products.length} products`);

            // Also fetch applicable promotions for these products
            if (products.length > 0) {
                promotions = await fetchPromotions({
                    productIds: productResult.productIds,
                    categoryIds: productResult.categoryIds,
                    limit: 5,
                });
                if (promotions.length > 0) {
                    data.promotions = promotions;
                    console.log(`Found ${promotions.length} applicable promotions`);
                }
            }
        } else if (extractedIntent.intent === "CHECK_PROMOTIONS") {
            promotions = await fetchPromotions({ limit: 10 });
            data.promotions = promotions;
            console.log(`Found ${promotions.length} promotions`);
        }

        // Step 3: Generate response using AI with fetched data
        console.log("Step 3: Generating response...");
        const responseText = await generateResponse(
            message,
            history,
            extractedIntent.intent,
            data
        );

        // Audit logging
        await logChatInteraction({
            sessionId,
            userQuery: message,
            detectedIntent: extractedIntent.intent,
            toolUsed: extractedIntent.intent !== "GENERAL_CHAT" ? "TWO_STEP_EXTRACTION" : null,
            toolInput: extractedIntent.searchParams,
            toolOutput: { products, promotions },
            finalResponse: responseText,
            responseTime: Date.now() - startTime,
            userId,
        });

        // Save to chat history
        await saveToHistory(sessionId, message, responseText);

        return {
            success: true,
            response: responseText,
            intent: extractedIntent.intent,
            searchParams: extractedIntent.searchParams,
        };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await logChatInteraction({
            sessionId,
            userQuery: message,
            detectedIntent: extractedIntent?.intent,
            finalResponse: "",
            errorMessage,
            responseTime: Date.now() - startTime,
            userId,
        });

        console.error("Chat agent error:", error);

        return {
            success: false,
            response: "I'm sorry, I encountered an error. Please try again.",
            error: errorMessage,
        };
    }
}

async function saveToHistory(sessionId, userMessage, assistantMessage) {
    try {
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
        });

        if (session) {
            await prisma.chatMessage.createMany({
                data: [
                    { chatSessionId: sessionId, role: "user", content: userMessage },
                    { chatSessionId: sessionId, role: "assistant", content: assistantMessage },
                ],
            });
        }
    } catch (error) {
        console.error("Failed to save chat history:", error);
    }
}

export async function createChatSession(userId = null, title = "New Chat") {
    try {
        const session = await prisma.chatSession.create({
            data: { title, userId },
        });
        return { id: session.id };
    } catch (error) {
        console.error("Failed to create chat session:", error);
        throw new Error("Failed to create chat session");
    }
}

export async function getChatHistory(sessionId) {
    try {
        const messages = await prisma.chatMessage.findMany({
            where: { chatSessionId: sessionId },
            orderBy: { createdAt: "asc" },
            select: { role: true, content: true },
        });
        return messages;
    } catch (error) {
        console.error("Failed to get chat history:", error);
        return [];
    }
}
