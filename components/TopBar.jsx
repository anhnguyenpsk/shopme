'use client'
import Link from 'next/link'
import { Facebook, Instagram, Bell } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { clearCart } from '@/lib/features/cart/cartSlice'

const TopBar = () => {
    const { data: session } = useSession()
    const router = useRouter()
    const dispatch = useDispatch()
    const [open, setOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open])

    const cart = useSelector(state => state.cart)

    const handleLogout = async () => {
        setOpen(false)
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
            })
        } catch (error) {
            console.error('Failed to save cart:', error)
        }
        // Clear cart from Redux
        dispatch(clearCart())
        await signOut({ redirect: false })
        router.push('/')
    }

    return (
        <div className="bg-white text-xs text-slate-700 border-b font-light">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center h-9">
                    <div className="flex items-center gap-4">
                        <Link href={session?.user?.role === 'STORE_OWNER' ? '/store/dashboard' : session ? '/create-store' : '/login'} className="hover:text-green-500 transition-colors">
                            {session?.user?.role === 'STORE_OWNER' ? 'Seller Dashboard' : 'Become a seller'}
                        </Link>
                        <div className="border-l h-3"></div>
                        <div className="flex items-center gap-1">
                            <span>Follow us on</span>
                            <a href="https://facebook.com" title="Facebook" target="_blank" rel="noopener noreferrer">
                                <Facebook size={14} />
                            </a>
                            <a href="https://instagram.com" title="Instagram" target="_blank" rel="noopener noreferrer">
                                <Instagram size={14} />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/notifications" className="flex items-center gap-1 hover:text-green-500 transition-colors">
                            <Bell size={14} />
                            <span>notifications</span>
                        </Link>

                        {session ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setOpen((o) => !o)}
                                    className="font-medium hover:text-green-500 transition-colors"
                                    aria-haspopup="menu"
                                    aria-expanded={open}
                                >
                                    Hi, {session.user.name || 'User'}
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
                            <>
                                <Link href="/register" className="font-medium hover:text-green-500 transition-colors">Sign up</Link>
                                <div className="border-l h-3"></div>
                                <Link href="/login" className="font-medium hover:text-green-500 transition-colors">Login</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TopBar

