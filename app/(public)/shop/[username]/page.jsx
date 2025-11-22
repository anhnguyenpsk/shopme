'use client'
import ProductCard from "@/components/ProductCard"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"
import Loading from "@/components/Loading"
import Image from "next/image"
import axios from "axios"
import toast from "react-hot-toast"
import PublicVoucherList from "@/components/vouchers/PublicVoucherList"

export default function StoreShop() {

    const { username } = useParams()
    const [products, setProducts] = useState([])
    const [storeInfo, setStoreInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchStoreData = async () => {
        if (!username) {
            setError("Store username is required")
            setLoading(false)
            return
        }

        try {
            const { data } = await axios.get(`/api/store/${username}`)
            setStoreInfo(data.storeInfo)
            setProducts(data.products)
        } catch (error) {
            console.error("Error fetching store data:", error)
            setError(error.response?.data?.error || "Store not found")
            toast.error(error.response?.data?.error || "Failed to load store")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStoreData()
    }, [username])

    if (loading) {
        return <Loading />
    }

    if (error) {
        return (
            <div className="min-h-[70vh] mx-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-slate-800 mb-2">Store Not Found</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[70vh] mx-6">
            {/* Store Info Banner */}
            {storeInfo && (
                <div className="max-w-7xl mx-auto bg-slate-50 rounded-xl p-6 md:p-10 mt-6 flex flex-col md:flex-row items-center gap-6 shadow-xs">
                    <Image
                        src={storeInfo.logo || "/api/placeholder/150/150"}
                        alt={storeInfo.name}
                        className="size-32 sm:size-38 object-cover border-2 border-slate-100 rounded-md"
                        width={200}
                        height={200}
                    />
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-slate-800">{storeInfo.name}</h1>
                        <p className="text-sm text-slate-600 mt-2 max-w-lg">{storeInfo.description}</p>
                        <div className="space-y-2 text-sm text-slate-500 mt-4">
                            <div className="flex items-center justify-center md:justify-start">
                                <MapPinIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.address}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <MailIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.email}</span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <PhoneIcon className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{storeInfo.contact}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vouchers */}
            {storeInfo && <PublicVoucherList storeId={storeInfo.id} />}

            {/* Store Status Warning */}
            {storeInfo && !storeInfo.isActive && (
                <div className="max-w-7xl mx-auto mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Store Temporarily Closed</h3>
                        <p className="text-yellow-700">This store is not currently accepting new orders.</p>
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="max-w-7xl mx-auto mb-40">
                <h1 className="text-2xl mt-12">Shop <span className="text-slate-800 font-medium">Products</span></h1>
                {products.length > 0 ? (
                    <div className="mt-5 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto">
                        {products.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                ) : (
                    <div className="mt-5 text-center py-20">
                        <p className="text-slate-500 text-lg">
                            {storeInfo && !storeInfo.isActive 
                                ? "This store is temporarily closed." 
                                : "No products available in this store yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}