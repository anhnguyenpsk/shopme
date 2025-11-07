import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "./StoreProvider";
import "./globals.css";
import AuthSessionProvider from "./AuthSessionProvider";
import CartSyncProvider from "@/components/CartSyncProvider";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "ShopMe. - Shop smarter",
    description: "ShopMe. - Shop smarter",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${outfit.className} antialiased`}>
                <AuthSessionProvider>
                    <StoreProvider>
                        <CartSyncProvider>
                            <Toaster />
                            {children}
                        </CartSyncProvider>
                    </StoreProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
