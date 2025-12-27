"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const ChatWindow = dynamic(() => import("./ChatWindow"), {
    ssr: false,
    loading: () => null,
});

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${isOpen
                        ? "bg-gray-600 hover:bg-gray-700 rotate-0"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    }`}
                aria-label={isOpen ? "Close chat" : "Open chat"}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
        </>
    );
}
