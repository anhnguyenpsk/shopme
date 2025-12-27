"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { runAgent, createChatSession, getChatHistory } from "@/actions/chat";

export default function ChatWindow({ onClose, sessionId: initialSessionId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(initialSessionId);
    const messagesEndRef = useRef(null);

    // Initialize session and load history
    useEffect(() => {
        const initSession = async () => {
            if (!sessionId) {
                const { id } = await createChatSession();
                setSessionId(id);
            } else {
                // Load existing history
                const history = await getChatHistory(sessionId);
                if (history.length > 0) {
                    setMessages(history.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })));
                }
            }
        };
        initSession();
    }, [sessionId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !sessionId) return;

        const userMessage = input.trim();
        setInput("");

        // Add user message to UI
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            // Get history for context (last 10 messages)
            const history = messages.slice(-10);

            // Call the agent
            const result = await runAgent(userMessage, sessionId, history);

            // Add assistant response
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: result.response },
            ]);
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I encountered an error. Please try again."
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg">ShopMe Assistant</h3>
                    <p className="text-xs text-indigo-200">Ask about products & promotions</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <p className="text-lg font-medium mb-2">👋 Welcome!</p>
                        <p className="text-sm">How can I help you today?</p>
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => setInput("Show me the iphone 17 pro max price")}
                                className="block w-full text-left text-sm bg-white p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                            >
                                Show me the iphone 17 pro max price 
                            </button>
                            <button
                                onClick={() => setInput("What promotions are available?")}
                                className="block w-full text-left text-sm bg-white p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                            >
                                What promotions are available?
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 rounded-2xl ${msg.role === "user"
                                    ? "bg-indigo-600 text-white rounded-br-md"
                                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                <span className="text-sm text-gray-500">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about products or promotions..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
}
