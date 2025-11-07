'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { formatVND } from "../lib/currency";

const ProductDetails = ({ product }) => {

    const productId = product.id;

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();
    const { data: session } = useSession();

    const router = useRouter()

    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : ["/api/placeholder/300/250"];
    const [mainImage, setMainImage] = useState(images[0]);

    const addToCartHandler = () => {
        dispatch(addToCart({ productId }))
    }

    const ratings = Array.isArray(product.rating) ? product.rating : []
    const averageRating = ratings.length > 0 ? (ratings.reduce((acc, item) => acc + (item.rating || 0), 0) / ratings.length) : 0

    const brand = product.brandRef || null;

    return (
        <div className="flex max-lg:flex-col gap-12">
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {images.map((image, index) => (
                        <div key={index} onClick={() => setMainImage(images[index])} className="bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer">
                            <Image src={image} className="group-hover:scale-103 group-active:scale-95 transition" alt="" width={45} height={45} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg ">
                    <Image src={mainImage} alt="" width={250} height={250} />
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                {brand && (
                    <div className='flex items-center gap-2 mt-2'>
                        <span className='text-sm text-slate-500'>Brand:</span>
                        <div className='flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md'>
                            <div className='relative size-6'>
                                <Image src={brand.logo} alt={brand.name} fill className='object-contain' />
                            </div>
                            <span className='text-sm font-medium text-slate-700'>{brand.name}</span>
                        </div>
                    </div>
                )}
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{ratings.length} Reviews</p>
                </div>
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p> {formatVND(product.price)} </p>
                </div>
                {/* Stock availability */}
                <div className="flex items-center gap-2 mb-4">
                    {product.quantity > 0 ? (
                        <>
                            <div className="size-2 rounded-full bg-green-500"></div>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-green-600">{product.quantity}</span> items in stock
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="size-2 rounded-full bg-red-500"></div>
                            <p className="text-sm text-red-600 font-semibold">Out of stock</p>
                        </>
                    )}
                </div>
                {/* Store status warning */}
                {product.store && !product.store.isActive && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            This store is temporarily closed and not accepting new orders.
                        </p>
                    </div>
                )}
                <div className="flex items-end gap-5 mt-10">
                    {
                        cart[productId] && (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} maxQuantity={product.quantity} />
                            </div>
                        )
                    }
                    <button 
                        onClick={() => !cart[productId] ? addToCartHandler() : (session?.user ? router.push('/cart') : router.push('/login'))} 
                        className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
                        disabled={product.quantity === 0 || (product.store && !product.store.isActive)}
                    >
                        {(product.store && !product.store.isActive) ? 'Store Temporarily Closed' : 
                         product.quantity === 0 ? 'Out of Stock' : 
                         (!cart[productId] ? 'Add to Cart' : 'View Cart')}
                    </button>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails