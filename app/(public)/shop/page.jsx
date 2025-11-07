'use client'
import { Suspense, useEffect, useState } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"
import axios from "axios"
import StoreCard from "@/components/StoreCard"

 function ShopContent() {

    // get query params ?search=abc&category=xyz
    const searchParams = useSearchParams()
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const router = useRouter()

    const products = useSelector(state => state.product.list)
    const [stores, setStores] = useState([])
    const [loadingStores, setLoadingStores] = useState(true)
    const [filteredProducts, setFilteredProducts] = useState([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [categoryName, setCategoryName] = useState('')

    const fetchFilteredProducts = async () => {
        setLoadingProducts(true)
        try {
            const params = new URLSearchParams()
            if (category) params.append('category', category)
            if (search) params.append('q', search)
            
            const { data } = await axios.get(`/api/products/search?${params.toString()}`)
            setFilteredProducts(data)
            
            // Extract category name from the first product if available
            if (data.length > 0 && data[0].categoryRef) {
                setCategoryName(data[0].categoryRef.name)
            }
        } catch (error) {
            console.error("Error fetching filtered products:", error)
            setFilteredProducts([])
        } finally {
            setLoadingProducts(false)
        }
    }

    const fetchStores = async () => {
        try {
            const { data } = await axios.get('/api/stores')
            setStores(data.stores)
        } catch (error) {
            console.error("Error fetching stores:", error)
        } finally {
            setLoadingStores(false)
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    useEffect(() => {
        if (category || search) {
            fetchFilteredProducts()
        } else {
            setFilteredProducts([])
            setCategoryName('')
        }
    }, [category, search])

    // Determine which products to display
    const displayProducts = (category || search) ? filteredProducts : products

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto">
                {!search && !category && (
                    <>
                        {/* Featured Stores Section */}
                        <div className="mb-12">
                            <h2 className="text-2xl text-slate-500 my-6">Featured <span className="text-slate-700 font-medium">Stores</span></h2>
                            {loadingStores ? (
                                <div className="text-slate-500">Loading stores...</div>
                            ) : stores.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                                    {stores.slice(0, 3).map((store) => (
                                        <StoreCard key={store.id} store={store} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-slate-500">No stores available yet.</div>
                            )}
                        </div>
                    </>
                )}

                {/* Products Section */}
                <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 my-6 flex items-center gap-2 cursor-pointer">
                    {(search || category) && <MoveLeftIcon size={20} />}  
                    {categoryName ? (
                        <>
                            <span className="text-slate-700 font-medium">{categoryName}</span> Products
                        </>
                    ) : (
                        <>All <span className="text-slate-700 font-medium">Products</span></>
                    )}
                </h1>

                {loadingProducts ? (
                    <div className="text-slate-500 py-12 text-center">Loading products...</div>
                ) : displayProducts.length > 0 ? (
                    <div className="grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12 mx-auto mb-32">
                        {displayProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                    </div>
                ) : (
                    <div className="text-slate-500 py-12 text-center">
                        {(category || search) ? 'No products found matching your criteria.' : 'No products available yet.'}
                    </div>
                )}
            </div>
        </div>
    )
}


export default function Shop() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}