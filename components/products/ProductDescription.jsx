'use client'
import { ArrowRight, StarIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Mô tả')

    const ratings = Array.isArray(product.rating) ? product.rating : []
    const store = product?.store || {}
    const storeLogo = typeof store.logo === 'string' && store.logo ? store.logo : '/api/placeholder/80/80'


    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Mô tả', 'Đánh giá'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description */}
            {selectedTab === "Mô tả" && (
                <p className="max-w-xl whitespace-pre-line">{product.description}</p>
            )}

            {/* Reviews */}
            {selectedTab === "Đánh giá" && (
                <div className="flex flex-col gap-3 mt-14">
                    {ratings.map((item, index) => (
                        <div key={index} className="flex gap-5 mb-10">
                            <Image src={item?.user?.image || '/api/placeholder/40/40'} alt="" className="size-10 rounded-full" width={100} height={100} />
                            <div>
                                <div className="flex items-center" >
                                    {Array(5).fill('').map((_, idx) => (
                                        <StarIcon key={idx} size={18} className='text-transparent mt-0.5' fill={(item?.rating || 0) >= idx + 1 ? "#00C950" : "#D1D5DB"} />
                                    ))}
                                </div>
                                <p className="text-sm max-w-lg my-4">{item?.review || ''}</p>
                                <p className="font-medium text-slate-800">{item?.user?.name || 'Ẩn danh'}</p>
                                <p className="mt-3 font-light">{item?.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Store Page */}
            <div className="flex gap-3 mt-14">
                <Image src={storeLogo} alt="" className="size-11 rounded-full ring ring-slate-400" width={100} height={100} />
                <div>
                    <p className="font-medium text-slate-600">Sản phẩm của {store?.name || 'Store'}</p>
                    {store?.username && (
                        <Link href={`/shop/${store.username}`} className="flex items-center gap-1.5 text-green-500"> xem cửa hàng <ArrowRight size={14} /></Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ProductDescription