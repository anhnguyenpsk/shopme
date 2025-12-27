'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Link from "next/link"
import Loading from "@/components/shared/Loading"

import { formatVND } from "@/lib/utils/currency"
import { FilePenIcon } from "lucide-react"

export default function StoreManageProducts() {

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/store/product');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            } else {
                toast.error('Lỗi khi tải danh sách sản phẩm.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi tải danh sách sản phẩm.');
        }
        setLoading(false);
    };

    const toggleActive = async (productId, currentIsActive) => {
        try {
            const response = await fetch('/api/store/product', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, isActive: !currentIsActive }),
            });

            if (response.ok) {
                toast.success('Cập nhật trạng thái sản phẩm thành công!');
                fetchProducts(); // Refresh the product list
            } else {
                toast.error('Lỗi khi cập nhật trạng thái sản phẩm.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi khi cập nhật trạng thái.');
        }
    };


    useEffect(() => {
        fetchProducts()
    }, [])

    if (loading) return <Loading />

    return (
        <>
            <h1 className="text-2xl text-slate-500 mb-5">Quản lý <span className="text-slate-800 font-medium">Sản phẩm</span></h1>
            <table className="w-full max-w-5xl text-left  ring ring-slate-200  rounded overflow-hidden text-sm">
                <thead className="bg-slate-50 text-gray-700 uppercase tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Tên sản phẩm</th>
                        <th className="px-4 py-3 hidden md:table-cell">Mô tả</th>
                        <th className="px-4 py-3">Giá</th>
                        <th className="px-4 py-3">Số lượng</th>
                        <th className="px-4 py-3">Hành động</th>
                    </tr>
                </thead>
                <tbody className="text-slate-700">
                    {products.map((product) => (
                        <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                    <Image width={40} height={40} className='p-1 shadow rounded cursor-pointer' src={product.images[0]} alt="" />
                                    {product.name}
                                </div>
                            </td>
                            <td className="px-4 py-3 max-w-md text-slate-600 hidden md:table-cell truncate">{product.description}</td>
                            <td className="px-4 py-3">
                                {product.minPrice && product.maxPrice && product.minPrice !== product.maxPrice
                                    ? `${formatVND(product.minPrice)} - ${formatVND(product.maxPrice)}`
                                    : formatVND(product.price)}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">
                                {product.quantity}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <div className="flex items-center gap-4">
                                    <Link href={`/store/edit-product/${product.id}`}>
                                        <FilePenIcon size={16} className="text-slate-500 hover:text-slate-700" />
                                    </Link>
                                    <label className="relative inline-flex items-center cursor-pointer text-gray-900">
                                        <input type="checkbox" className="sr-only peer" onChange={() => toast.promise(toggleActive(product.id, product.isActive), { loading: "Đang cập nhật..." })} checked={product.isActive} />
                                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200"></div>
                                        <span className="dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4"></span>
                                    </label>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    )
}