'use client'
import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";

const Navbar = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [search, setSearch] = useState('');
    const cartCount = useSelector(state => state.cart.total);

    const handleSearch = (e) => {
        e.preventDefault();
        router.push(`/shop?search=${search}`);
    }

    return (
        <header className="bg-white sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="text-4xl font-semibold text-slate-700">
                        <span className="text-green-600">shop</span>me<span className="text-green-600 text-5xl leading-0">.</span>
                    </Link>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl mx-8">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-100 border border-slate-200 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            />
                            <button type="submit" className="absolute right-0 top-0 h-full px-5 bg-green-500 text-white rounded-r-sm hover:bg-green-600 transition-colors">
                                <Search size={18} />
                            </button>
                        </form>
                        {/* Suggested links can go here */}
                        <div className="text-xs text-slate-500 mt-1 flex gap-3">
                            <Link href="/shop?search=Clothes" className="hover:text-green-500">Clothes</Link>
                            <Link href="/shop?search=Crocs" className="hover:text-green-500">Crocs</Link>
                            <Link href="/shop?search=iPhone 14" className="hover:text-green-500">iPhone 14</Link>
                            <Link href="/shop?search=Gaming mouse" className="hover:text-green-500">Gaming mouse</Link>
                            <Link href="/shop?search=Smart watch" className="hover:text-green-500">Smart watch</Link>
                        </div>
                    </div>

                    {/* Cart */}
                    <Link href={session ? "/cart" : "/login"} className="relative">
                        <ShoppingCart size={28} className="text-slate-600" />
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
                    </Link>
                </div>
            </div>
        </header>
    )
}

export default Navbar;