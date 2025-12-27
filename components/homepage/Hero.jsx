'use client'

import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'


const Hero = () => {
    const router = useRouter()
    const FREE_SHIP_THRESHOLD = 1250000
    const STARTS_FROM = 990000
    const PRODUCT_ID = "cmhwy1zt100034uig1faydc7j"
    const PRODUCT_IMAGE = "/uploads/products/ff25b8aa6abc6c023f0e1c06c3410b3b.png"
    const PRODUCT_NAME = "Wireless Headphone"
    const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

    return (
        <div className='mx-6'>
            <div className='flex max-xl:flex-col gap-8 max-w-7xl mx-auto my-10'>
                <div className='relative flex-1 flex flex-col bg-green-200 rounded-3xl xl:min-h-120 group'>
                    <div className='p-8 sm:p-20'>
                        <div className='inline-flex items-center gap-3 bg-green-300 text-green-600 pr-4 p-1 rounded-full text-xs sm:text-sm'>
                            <span className='bg-green-600 px-3 py-1 max-sm:ml-1 rounded-full text-white text-xs'>TIN MỚI</span> Miễn phí vận chuyển cho đơn hàng trên {vnd.format(FREE_SHIP_THRESHOLD)} <ChevronRightIcon className='group-hover:ml-2 transition-all' size={16} />
                        </div>
                        <h2 className='text-4xl sm:text-6xl leading-[1.2] my-5 font-medium bg-gradient-to-r from-slate-600 to-[#A0FF74] bg-clip-text text-transparent max-w-sm sm:max-w-xl'>
                            Sản phẩm ưng ý. <br /> Giá cả hợp lý.
                        </h2>
                        <div className='text-slate-800 text-sm font-medium mt-6 sm:mt-10'>
                            <p>Giá chỉ từ</p>
                            <p className='text-4xl'>{vnd.format(STARTS_FROM)}</p>
                        </div>
                        <button
                            onClick={() => router.push(`/product/${PRODUCT_ID}`)}
                            className='bg-slate-800 text-white text-sm py-2.5 px-7 sm:py-5 sm:px-12 mt-6 sm:mt-12 rounded-md hover:bg-slate-900 hover:scale-103 active:scale-95 transition'
                        >
                            KHÁM PHÁ NGAY
                        </button>
                    </div>
                    <Image
                        className='sm:absolute bottom-0 right-0 md:right-20 w-full sm:max-w-md object-contain'
                        src={PRODUCT_IMAGE}
                        alt={PRODUCT_NAME}
                        width={600}
                        height={600}
                        priority
                    />
                </div>
            </div>
        </div>
    )
}

export default Hero

