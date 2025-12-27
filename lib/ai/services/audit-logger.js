import prisma from "@/lib/prisma";

/**
 * Logs chat interactions to the ChatLogs table for auditing
 * @param {Object} data - Log data
 * @param {string} data.sessionId - Chat session ID
 * @param {string} data.userQuery - User's message
 * @param {string} [data.detectedIntent] - Detected intent (SEARCH_PRODUCTS, CHECK_PROMOTIONS, GENERAL_CHAT)
 * @param {string} [data.toolUsed] - Tool that was called
 * @param {Object} [data.toolInput] - Input passed to the tool
 * @param {Object} [data.toolOutput] - Output from the tool
 * @param {string} data.finalResponse - Final response to user
 * @param {number} data.responseTime - Time taken in milliseconds
 * @param {string} [data.errorMessage] - Error message if any
 * @param {string} [data.userId] - User ID if authenticated
 */
export async function logChatInteraction(data) {
    try {
        await prisma.chatLogs.create({
            data: {
                sessionId: data.sessionId,
                userQuery: data.userQuery,
                detectedIntent: data.detectedIntent,
                toolUsed: data.toolUsed,
                toolInput: data.toolInput || undefined,
                toolOutput: data.toolOutput || undefined,
                finalResponse: data.finalResponse,
                responseTime: data.responseTime,
                errorMessage: data.errorMessage,
                userId: data.userId,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging should not break the chat
        console.error("Failed to log chat interaction:", error);
    }
}
