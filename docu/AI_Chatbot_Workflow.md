# AI Chatbot Workflow - ShopMe

## Tổng quan (Overview)

AI Chatbot của ShopMe sử dụng **Two-Step Approach** với Google Gemini AI để xử lý yêu cầu của người dùng về sản phẩm và khuyến mãi.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SHOPME AI CHATBOT FLOW                        │
├──────────────────────────────────────────────────────────────────────┤
│  User Message → Intent Extraction → Data Fetching → AI Response     │
└──────────────────────────────────────────────────────────────────────┘
```

## Chi tiết các Phase

### Phase 1: Session Initialization

```plantuml
Customer -> ChatWindow: Mở cửa sổ chat
ChatWindow -> Server: createChatSession() hoặc getChatHistory()
Server -> Database: Tạo session mới hoặc lấy lịch sử chat
Database --> ChatWindow: Session ID / Chat History
```

**Mô tả:**

- Khi người dùng mở cửa sổ chat, hệ thống kiểm tra xem đã có session chưa
- Nếu chưa có: Tạo session mới trong database
- Nếu có: Load lịch sử tin nhắn cũ

### Phase 2: User Message Submission

```plantuml
Customer -> ChatWindow: Nhập tin nhắn "Show me Apple products"
ChatWindow -> ChatWindow: setMessages([...prev, userMessage])
ChatWindow -> Server: runAgent(message, sessionId, history)
```

**Mô tả:**

- Người dùng nhập và gửi tin nhắn
- UI cập nhật hiển thị tin nhắn ngay lập tức
- Gọi `runAgent()` - entry point chính của chatbot

### Phase 3: Step 1 - Intent Extraction (AI)

```plantuml
Server -> Gemini AI: extractIntent(message, history)
Gemini AI -> Gemini AI: generateObject với Zod Schema
Gemini AI --> Server: { intent, searchParams }
```

**Intent Types:**
| Intent | Trigger Keywords | Action |
|--------|------------------|--------|
| `SEARCH_PRODUCTS` | "product", "find", "search", "buy", "show me" | Tìm kiếm sản phẩm |
| `CHECK_PROMOTIONS` | "promo", "discount", "voucher", "deal", "sale" | Lấy danh sách khuyến mãi |
| `GENERAL_CHAT` | Các câu hỏi khác | Trả lời chung |

**Search Parameters Schema (Zod):**

```javascript
{
  intent: "SEARCH_PRODUCTS" | "CHECK_PROMOTIONS" | "GENERAL_CHAT",
  searchParams: {
    keywords: ["Apple", "iPhone"],  // Từ khóa tìm kiếm
    minPrice: 0,                     // Giá tối thiểu (VND)
    maxPrice: 50000000,              // Giá tối đa (VND)
    limit: 5                         // Số lượng kết quả
  }
}
```

**Fallback Mechanism:**

- Nếu AI extraction fail → Sử dụng keyword matching đơn giản
- Filter stop words và extract meaningful keywords

### Phase 4: Step 2 - Data Fetching (Database)

```plantuml
alt SEARCH_PRODUCTS
    Server -> Database: fetchProducts(searchParams)
    Database --> Server: Product[] với PUBLIC_PRODUCT_FIELDS
else CHECK_PROMOTIONS
    Server -> Database: fetchPromotions(limit)
    Database --> Server: VoucherCampaign[] với PUBLIC_VOUCHER_FIELDS
end
```

**Product Search Query:**

```javascript
prisma.product.findMany({
  where: {
    isActive: true,
    quantity: { gt: 0 },
    OR: keywords.flatMap((keyword) => [
      { name: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { brandRef: { name: { contains: keyword, mode: "insensitive" } } },
      { categoryRef: { name: { contains: keyword, mode: "insensitive" } } },
      { store: { name: { contains: keyword, mode: "insensitive" } } },
    ]),
  },
  select: PUBLIC_PRODUCT_FIELDS,
  take: limit,
  orderBy: { createdAt: "desc" },
});
```

**Permission Manager (Output Level):**

- Chỉ trả về các trường public:
  - Products: `id, name, description, price, images, quantity, category, brand, store`
  - Vouchers: `name, description, voucher_code, discount_value, min_order_value, start_date, end_date`

### Phase 5: Step 3 - Response Generation (AI)

```plantuml
Server -> Gemini AI: generateResponse(message, history, intent, data)
Gemini AI -> Gemini AI: generateText với system prompt + context
Gemini AI --> Server: Formatted response text
```

**System Prompt Structure:**

```
1. Role: Shopping Assistant cho ShopMe (Vietnam)
2. Guidelines:
   - Friendly và conversational
   - Chỉ recommend sản phẩm còn hàng
   - Format giá: VND (e.g., 990,000 VND)
   - Thông báo low stock
   - Format: bullet points / numbered lists
3. Data Injection:
   - PRODUCTS FOUND: [...] hoặc
   - ACTIVE PROMOTIONS: [...]
```

### Phase 6: Audit Logging & History Saving

```plantuml
par Parallel Operations
    Server -> Database: logChatInteraction(auditData)
    Server -> Database: saveToHistory(sessionId, messages)
end
```

**Audit Log Data:**
| Field | Description |
|-------|-------------|
| `sessionId` | ID phiên chat |
| `userQuery` | Tin nhắn người dùng |
| `detectedIntent` | Intent đã phát hiện |
| `toolUsed` | "TWO_STEP_EXTRACTION" hoặc null |
| `toolInput` | searchParams |
| `toolOutput` | { products, promotions } |
| `finalResponse` | Phản hồi của AI |
| `responseTime` | Thời gian xử lý (ms) |
| `errorMessage` | Lỗi (nếu có) |
| `userId` | ID người dùng (nếu đăng nhập) |

### Phase 7: Response to Client

```plantuml
Server --> ChatWindow: { success, response, intent, searchParams }
ChatWindow -> ChatWindow: setMessages([...prev, assistantResponse])
ChatWindow -> ChatWindow: Auto-scroll to bottom
ChatWindow --> Customer: Hiển thị phản hồi
```

## Error Handling

| Error Type             | Handling                                               |
| ---------------------- | ------------------------------------------------------ |
| AI API Error           | Fallback to keyword detection + friendly error message |
| Database Error         | Log error + return generic error response              |
| Missing API Key        | Throw error với message cụ thể                         |
| Intent Extraction Fail | Use `fallbackIntentDetection()`                        |

## PlantUML Diagram

Xem file: [AI_Chatbot_Workflow.puml](./AI_Chatbot_Workflow.puml)

Để render diagram, sử dụng:

- VS Code Extension: "PlantUML"
- Online: https://www.plantuml.com/plantuml/
- CLI: `plantuml AI_Chatbot_Workflow.puml`

## Tech Stack

| Component  | Technology                             |
| ---------- | -------------------------------------- |
| Frontend   | React (Next.js 15)                     |
| Backend    | Next.js Server Actions                 |
| AI Model   | Google Gemini 2.0 Flash                |
| AI SDK     | Vercel AI SDK (`ai`, `@ai-sdk/google`) |
| Database   | PostgreSQL (Neon)                      |
| ORM        | Prisma                                 |
| Validation | Zod                                    |
