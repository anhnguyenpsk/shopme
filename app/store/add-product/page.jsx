'use client'
import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"

export default function StoreAddProduct() {

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [images, setImages] = useState({ 1: '', 2: '', 3: '', 4: '' })
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        price: 0,
        categoryId: "",
        brandId: "",
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchCategoriesAndBrands = async () => {
            try {
                // Fetch categories
                const catResponse = await fetch('/api/categories');
                if (catResponse.ok) {
                    const catData = await catResponse.json();
                    setCategories(catData);
                } else {
                    toast.error('Failed to fetch categories.');
                }

                // Fetch brands
                const brandResponse = await fetch('/api/brand');
                if (brandResponse.ok) {
                    const brandData = await brandResponse.json();
                    setBrands(brandData.brands);
                } else {
                    toast.error('Failed to fetch brands.');
                }
            } catch (error) {
                toast.error('An error occurred while fetching data.');
            }
        };
        fetchCategoriesAndBrands();
    }, []);


    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const uploadFile = async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Upload failed')
        return data.path
    }

    const onFilePicked = async (key, file) => {
        try {
            const path = await uploadFile(file)
            setImages(prev => ({ ...prev, [key]: path }))
            toast.success('Image uploaded')
        } catch (err) {
            toast.error(err.message || 'Upload failed')
        }
    }


    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const pics = Object.values(images).filter(Boolean)
            if (pics.length === 0) throw new Error('Please upload at least one image')

            const payload = { ...productInfo, price: Number(productInfo.price), images: pics };
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Failed to create product')

            toast.success('Product added successfully!')

            setImages({ 1: '', 2: '', 3: '', 4: '' })
            setProductInfo({ name: '', description: '', price: 0, categoryId: '', brandId: '' })
        } catch (err) {
            toast.error(err.message || 'Failed to add product')
        } finally {
            setLoading(false)
        }
    }


    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            <div htmlFor="" className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] || assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => e.target.files?.[0] && onFilePicked(key, e.target.files[0])} hidden />
                    </label>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Name
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Enter product name" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Description
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Enter product description" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Price (VND)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" rows={5} className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
                </label>
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Category
                <select onChange={e => setProductInfo({ ...productInfo, categoryId: e.target.value })} value={productInfo.categoryId} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required>
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </label>

            <label htmlFor="" className="flex flex-col gap-2 mb-6">
                Brand
                <select onChange={e => setProductInfo({ ...productInfo, brandId: e.target.value })} value={productInfo.brandId} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded">
                    <option value="">No Brand (Handmade/Custom)</option>
                    {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                </select>
            </label>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Add Product</button>
        </form>
    )
}