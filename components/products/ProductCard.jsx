'use client'
import { StarIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { formatVND } from "@/lib/currency";

const ProductCard = ({ product }) => {


    // calculate the average rating of the product
    const ratings = Array.isArray(product.rating) ? product.rating : []
    const rating = ratings.length ? Math.round(ratings.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratings.length) : 0;

    const brand = product.brandRef || null;

    return (
        <Link href={`/product/${product.id}`} className=' group max-xl:mx-auto'>
            <div className='bg-[#F5F5F5] h-40  sm:w-60 sm:h-68 rounded-lg flex items-center justify-center relative'>
                <Image width={500} height={500} className='max-h-30 sm:max-h-40 w-auto group-hover:scale-115 transition duration-300' src={product.images && product.images[0] ? product.images[0] : '/api/placeholder/300/300'} alt="" />
                {brand?.logo && (
                    <div className='absolute top-2 right-2 bg-white rounded-md shadow-sm p-1.5 size-10'>
                        <Image src={brand.logo} alt={brand.name} width={32} height={32} className='object-contain' />
                    </div>
                )}
            </div>
            <div className='flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60'>
                <div>
                    <p>{product.name}</p>
                    <div className='flex'>
                        {Array(5).fill('').map((_, index) => (
                            <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                        ))}
                    </div>
                </div>
                <p>{formatVND(product.price)}</p>
            </div>
        </Link>
    )
}

export default ProductCard