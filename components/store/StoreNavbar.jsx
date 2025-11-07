'use client'
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from 'react-redux'
import { clearCart } from '@/lib/features/cart/cartSlice'

const StoreNavbar = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const dispatch = useDispatch();
    const cart = useSelector(state => state.cart);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const displayName = session?.user?.name || "Seller";

    const handleLogout = async () => {
        setOpen(false);
        // Save cart to database before clearing
        try {
            await fetch('/api/user/cart', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cartItems: cart.cartItems,
                    total: cart.total
                })
            });
        } catch (error) {
            console.error('Failed to save cart:', error);
        }
        // Clear cart from Redux
        dispatch(clearCart());
        await signOut({ redirect: false });
        router.push('/');
    };

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <Link href="/" className="relative text-4xl font-semibold text-slate-700">
                <span className="text-green-600">shop</span>me<span className="text-green-600 text-5xl leading-0">.</span>
                <p className="absolute text-xs font-semibold -top-1 -right-11 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-green-500">
                    Store
                </p>
            </Link>
            <div className="flex items-center gap-3" ref={dropdownRef}>
                {session ? (
                    <div className="relative">
                        <button
                            onClick={() => setOpen((o) => !o)}
                            className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-sm text-slate-700"
                            aria-haspopup="menu"
                            aria-expanded={open}
                        >
                            Hi, {displayName}
                        </button>
                        {open && (
                            <div
                                role="menu"
                                className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-50"
                            >
                                <Link
                                    href="/account"
                                    onClick={() => setOpen(false)}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    role="menuitem"
                                >
                                    My Account
                                </Link>
                                <Link
                                    href="/orders"
                                    onClick={() => setOpen(false)}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    role="menuitem"
                                >
                                    My Purchase
                                </Link>
                                <div className="border-t border-slate-200 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    role="menuitem"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p>Hi, Seller</p>
                )}
            </div>
        </div>
    )
}

export default StoreNavbar