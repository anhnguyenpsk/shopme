import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "./StoreProvider";
import "./globals.css";
import AuthSessionProvider from "./AuthSessionProvider";
import CartSyncProvider from "@/components/checkout/CartSyncProvider";
import ChatWidget from "@/components/chat/ChatWidget";

const beVietnamPro = Be_Vietnam_Pro({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500", "600", "700"]
});

export const metadata = {
    title: "ShopMe. - Mua sắm thông minh hơn",
    description: "ShopMe. - Mua sắm thông minh hơn",
};

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body className={`${beVietnamPro.className} antialiased`}>
                <AuthSessionProvider>
                    <StoreProvider>
                        <CartSyncProvider>
                            <Toaster />
                            {children}
                            <ChatWidget />
                        </CartSyncProvider>
                    </StoreProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}

