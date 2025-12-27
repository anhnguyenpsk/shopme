'use client'
import { assets } from "@/assets/assets"
import Image from "next/image"
import { useState, useEffect, use } from "react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function EditProduct({ params }) {
    const { productId } = use(params);
    const router = useRouter();

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [images, setImages] = useState({ 1: '', 2: '', 3: '', 4: '' });
    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        price: 0,
        quantity: 0,
        categoryId: "",
        brandId: "",
    });
    const [loading, setLoading] = useState(true);

    // Variation State
    const [hasVariations, setHasVariations] = useState(false);
    const [variationGroups, setVariationGroups] = useState([]);
    const [variants, setVariants] = useState([]);

    const handleAddGroup = () => {
        if (variationGroups.length < 2) {
            setVariationGroups([...variationGroups, { name: '', options: [] }]);
        }
    };

    const handleRemoveGroup = (index) => {
        const newGroups = [...variationGroups];
        newGroups.splice(index, 1);
        setVariationGroups(newGroups);
        // If removing group, we might want to clear variants or logic becomes complex.
        setVariants([]);
    };

    const handleGroupChange = (index, field, value) => {
        const newGroups = [...variationGroups];
        newGroups[index][field] = value;
        setVariationGroups(newGroups);
    };

    const handleAddOption = (groupIndex, option) => {
        if (!option.trim()) return;
        const newGroups = [...variationGroups];
        if (!newGroups[groupIndex].options.includes(option.trim())) {
            if (newGroups[groupIndex].options.length >= 50) {
                toast.error("Tối đa 50 tùy chọn mỗi nhóm");
                return;
            }
            newGroups[groupIndex].options.push(option.trim());
            setVariationGroups(newGroups);
            setVariants([]);
        }
    };

    const handleRemoveOption = (groupIndex, optionIndex) => {
        const newGroups = [...variationGroups];
        newGroups[groupIndex].options.splice(optionIndex, 1);
        setVariationGroups(newGroups);
        setVariants([]);
    };

    const generateVariants = () => {
        if (variationGroups.length === 0) return;

        const generate = (groups, prefix = {}) => {
            if (groups.length === 0) return [prefix];
            const firstGroup = groups[0];
            const restGroups = groups.slice(1);
            let results = [];

            for (const option of firstGroup.options) {
                results = results.concat(generate(restGroups, { ...prefix, [firstGroup.name]: option }));
            }
            return results;
        };

        const combinations = generate(variationGroups);
        if (combinations.length > 100) {
            toast.error(`Quá nhiều tổ hợp (${combinations.length}). Giới hạn là 100.`);
            return;
        }

        // Merge with existing variants if possible? 
        // For simplicity in Edit mode, simplistic "Merge" isn't easy if options changed.
        // We'll regenerate, but try to preserve if attributes match exactly.
        const newVariants = combinations.map(combo => {
            // Check if exact match exists in current variants (even if freshly fetched)
            const existing = variants.find(v => JSON.stringify(v.attributes) === JSON.stringify(combo));
            if (existing) return existing;

            return {
                attributes: combo,
                price: Number(productInfo.price) || 0,
                quantity: 0,
                sku: '',
                images: []
            };
        });

        setVariants(newVariants);
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };


    useEffect(() => {
        const fetchProductAndCategories = async () => {
            try {
                // Fetch categories
                const catResponse = await fetch('/api/categories');
                if (catResponse.ok) {
                    const catData = await catResponse.json();
                    setCategories(catData);
                } else {
                    toast.error('Lỗi khi tải danh mục.');
                }

                // Fetch brands
                const brandResponse = await fetch('/api/brand');
                if (brandResponse.ok) {
                    const brandData = await brandResponse.json();
                    setBrands(brandData.brands);
                } else {
                    toast.error('Lỗi khi tải thương hiệu.');
                }

                // Fetch product data
                const prodResponse = await fetch(`/api/store/product/${productId}`);
                if (prodResponse.ok) {
                    const prodData = await prodResponse.json();
                    setProductInfo({
                        name: prodData.name || "",
                        description: prodData.description || "",
                        price: prodData.price || 0,
                        quantity: prodData.quantity || 0,
                        categoryId: prodData.categoryId || "",
                        brandId: prodData.brandId || "",
                    });

                    setHasVariations(prodData.hasVariations || false);
                    setVariationGroups(Array.isArray(prodData.variationGroups) ? prodData.variationGroups : []);
                    if (Array.isArray(prodData.variants)) {
                        setVariants(prodData.variants);
                    }

                    const existingImages = {};
                    prodData.images.forEach((img, index) => {
                        existingImages[index + 1] = img;
                    });
                    setImages(prev => ({ ...prev, ...existingImages }));
                } else {
                    toast.error('Lỗi khi tải dữ liệu sản phẩm.');
                }
            } catch (error) {
                toast.error('Đã xảy ra lỗi.');
            } finally {
                setLoading(false);
            }
        };

        fetchProductAndCategories();
    }, [productId]);

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value });
    };

    const uploadFile = async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Upload failed');
        return data.path;
    };

    const onFilePicked = async (key, file) => {
        try {
            const path = await uploadFile(file);
            setImages(prev => ({ ...prev, [key]: path }));
            toast.success('Đã tải ảnh lên');
        } catch (err) {
            toast.error(err.message || 'Tải ảnh thất bại');
        }
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const pics = Object.values(images).filter(Boolean);
            if (pics.length === 0) throw new Error('Vui lòng tải lên ít nhất một ảnh');

            const payload = {
                ...productInfo,
                price: Number(productInfo.price),
                quantity: hasVariations ? 0 : Number(productInfo.quantity), // Ignore quantity if hasVariations
                images: pics,
                hasVariations,
                variationGroups: hasVariations ? variationGroups : null,
                variants: hasVariations ? variants : []
            };

            if (hasVariations) {
                if (variationGroups.length === 0) throw new Error("Vui lòng thêm ít nhất một nhóm biến thể");
                if (variants.length === 0) throw new Error("Vui lòng tạo danh sách biến thể");
                for (const v of variants) {
                    if (v.price < 0) throw new Error("Giá biến thể không được âm");
                    if (v.quantity < 0) throw new Error("Số lượng biến thể không được âm");
                }
            }
            const res = await fetch(`/api/store/product/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Lỗi khi cập nhật sản phẩm');

            toast.success('Cập nhật sản phẩm thành công!');
            router.push('/store/manage-product');
        } catch (err) {
            toast.error(err.message || 'Lỗi khi cập nhật sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Đang cập nhật..." })} className="text-slate-500 mb-28">
            <h1 className="text-2xl">Chỉnh sửa <span className="text-slate-800 font-medium">Sản phẩm</span></h1>
            <p className="mt-7">Hình ảnh sản phẩm</p>

            <div htmlFor="" className="flex gap-3 mt-4">
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`images${key}`}>
                        <Image width={300} height={300} className='h-15 w-auto border border-slate-200 rounded cursor-pointer' src={images[key] || assets.upload_area} alt="" />
                        <input type="file" accept='image/*' id={`images${key}`} onChange={e => e.target.files?.[0] && onFilePicked(key, e.target.files[0])} hidden />
                    </label>
                ))}
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Tên sản phẩm
                <input type="text" name="name" onChange={onChangeHandler} value={productInfo.name} placeholder="Nhập tên sản phẩm" className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required />
            </label>

            <label htmlFor="" className="flex flex-col gap-2 my-6 ">
                Mô tả
                <textarea name="description" onChange={onChangeHandler} value={productInfo.description} placeholder="Nhập mô tả sản phẩm" rows={5} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none" required />
            </label>

            <div className="flex gap-5">
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Giá (VND)
                    <input type="number" name="price" onChange={onChangeHandler} value={productInfo.price} placeholder="0" className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded" required />
                </label>
                <label htmlFor="" className="flex flex-col gap-2 ">
                    Số lượng
                    <input
                        type="number"
                        name="quantity"
                        onChange={onChangeHandler}
                        value={hasVariations ? variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0) : productInfo.quantity}
                        placeholder="0"
                        min="0"
                        disabled={hasVariations}
                        className={`w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded ${hasVariations ? 'bg-slate-100 text-slate-400' : ''}`}
                        required
                    />
                </label>
            </div>

            <label htmlFor="" className="flex flex-col gap-2 my-6">
                Danh mục
                <select onChange={e => setProductInfo({ ...productInfo, categoryId: e.target.value })} value={productInfo.categoryId} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded" required>
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                </select>
            </label>

            <label htmlFor="" className="flex flex-col gap-2 mb-6">
                Thương hiệu
                <select onChange={e => setProductInfo({ ...productInfo, brandId: e.target.value })} value={productInfo.brandId} className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded">
                    <option value="">Không có thương hiệu (Thủ công/Tùy chỉnh)</option>
                    {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                </select>
            </label>

            {/* Variations Section */}
            <div className="border-t pt-6 my-6">
                <label className="flex items-center gap-2 text-slate-800 font-medium cursor-pointer">
                    <input type="checkbox" checked={hasVariations} onChange={e => setHasVariations(e.target.checked)} className="w-4 h-4" />
                    Sản phẩm có biến thể?
                </label>

                {hasVariations && (
                    <div className="mt-4 p-4 border rounded bg-slate-50">
                        <h3 className="font-medium mb-2">Nhóm biến thể (Tối đa 2)</h3>
                        {variationGroups.map((group, gIndex) => (
                            <div key={gIndex} className="mb-4 p-3 bg-white border rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <input
                                        type="text"
                                        placeholder="Tên nhóm (ví dụ: Màu sắc)"
                                        value={group.name}
                                        onChange={e => handleGroupChange(gIndex, 'name', e.target.value)}
                                        className="border p-1 rounded font-medium"
                                    />
                                    <button type="button" onClick={() => handleRemoveGroup(gIndex)} className="text-red-500 text-sm">Xóa nhóm</button>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {group.options.map((opt, oIndex) => (
                                        <span key={oIndex} className="bg-slate-100 px-2 py-1 rounded text-sm flex items-center gap-2">
                                            {opt}
                                            <button type="button" onClick={() => handleRemoveOption(gIndex, oIndex)} className="text-xs text-red-500 font-bold">x</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" id={`new-edit-option-${gIndex}`} placeholder="Thêm tùy chọn (ví dụ: Đỏ)" className="border p-1 rounded text-sm"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddOption(gIndex, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                    <button type="button"
                                        onClick={() => {
                                            const input = document.getElementById(`new-edit-option-${gIndex}`);
                                            handleAddOption(gIndex, input.value);
                                            input.value = '';
                                        }}
                                        className="bg-slate-200 px-2 rounded text-sm hover:bg-slate-300"
                                    >Thêm</button>
                                </div>
                            </div>
                        ))}

                        {variationGroups.length < 2 && (
                            <button type="button" onClick={handleAddGroup} className="text-blue-600 text-sm hover:underline">+ Thêm nhóm biến thể</button>
                        )}

                        {variationGroups.length > 0 && (
                            <div className="mt-4">
                                <button type="button" onClick={generateVariants} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Tạo / Cập nhật biến thể</button>
                            </div>
                        )}

                        {variants.length > 0 && (
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                                        <tr>
                                            <th className="px-3 py-2">Biến thể</th>
                                            <th className="px-3 py-2">Giá</th>
                                            <th className="px-3 py-2">Số lượng</th>
                                            <th className="px-3 py-2">SKU (Tùy chọn)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.map((variant, index) => (
                                            <tr key={index} className="bg-white border-b">
                                                <td className="px-3 py-2 font-medium">
                                                    {Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="number" min="0" className="border rounded w-20 p-1"
                                                        value={variant.price} onChange={e => handleVariantChange(index, 'price', e.target.value)} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="number" min="0" className="border rounded w-20 p-1"
                                                        value={variant.quantity} onChange={e => handleVariantChange(index, 'quantity', e.target.value)} />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input type="text" className="border rounded w-24 p-1"
                                                        value={variant.sku || ''} onChange={e => handleVariantChange(index, 'sku', e.target.value)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <br />

            <button disabled={loading} className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition">Cập nhật sản phẩm</button>
        </form>
    )
}

