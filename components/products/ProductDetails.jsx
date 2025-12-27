'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "@/components/shared/Counter";
import { useDispatch, useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { formatVND } from "@/lib/currency";

const ProductDetails = ({ product }) => {

    const productId = product.id;

    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();
    const { data: session } = useSession();

    const router = useRouter()

    const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : ["/api/placeholder/300/250"];
    const [mainImage, setMainImage] = useState(images[0]);

    // Variation State
    const [selectedOptions, setSelectedOptions] = useState({}); // { "Color": "Red" }
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Variation Logic
    const hasVariations = product.hasVariations;
    const variationGroups = Array.isArray(product.variationGroups) ? product.variationGroups : [];

    // Auto-select first options if not selected? OR leave empty. 
    // Usually best to leave empty or select defaults. 
    // Let's leave empty and force user to select.

    const handleOptionSelect = (groupName, option) => {
        const newOptions = { ...selectedOptions, [groupName]: option };
        setSelectedOptions(newOptions);

        // Try to find variant
        if (Object.keys(newOptions).length === variationGroups.length) {
            const found = product.variants?.find(v => {
                // v.attributes is Json object. Compare key-values.
                // Ensure all matches.
                return Object.entries(newOptions).every(([key, val]) => v.attributes[key] === val);
            });
            setSelectedVariant(found || null);
            if (found && Array.isArray(found.images) && found.images.length > 0) {
                setMainImage(found.images[0]);
            }
        } else {
            setSelectedVariant(null);
        }
    };

    const addToCartHandler = () => {
        if (hasVariations && !selectedVariant) {
            // Check if all options selected
            if (Object.keys(selectedOptions).length < variationGroups.length) {
                // Determine missing
                // alert/toast?
                // Just do nothing or shake? 
                // We'll trust the button is disabled or show error.
                // Toast is available.
                // Let's assume user will see visual feedback (button disabled).
                // Toast is available.
                // const msg = "Vui lòng chọn tất cả các tùy chọn"; 
                return;
            }
            // If selected but no variant found? (Shouldn't happen if logic correct)
        }
        dispatch(addToCart({ productId, variantId: selectedVariant?.id || null }))
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
                        <span className='text-sm text-slate-500'>Thương hiệu:</span>
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
                    <p className="text-sm ml-3 text-slate-500">{ratings.length} Đánh giá</p>
                </div>
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p> {formatVND(selectedVariant ? selectedVariant.price : product.price)} </p>
                </div>
                {/* Stock availability */}
                <div className="flex items-center gap-2 mb-4">
                    {(selectedVariant ? selectedVariant.quantity : product.quantity) > 0 ? (
                        <>
                            <div className="size-2 rounded-full bg-green-500"></div>
                            <p className="text-sm text-slate-600">
                                <span className="font-semibold text-green-600">{selectedVariant ? selectedVariant.quantity : product.quantity}</span> sản phẩm có sẵn
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="size-2 rounded-full bg-red-500"></div>
                            <p className="text-sm text-red-600 font-semibold">Hết hàng</p>
                        </>
                    )}
                </div>

                {/* Variation Selectors */}
                {hasVariations && variationGroups.map((group, idx) => (
                    <div key={idx} className="mb-4">
                        <p className="font-medium mb-2 text-sm text-slate-700">{group.name}</p>
                        <div className="flex flex-wrap gap-2">
                            {group.options.map((option, optIdx) => {
                                const isSelected = selectedOptions[group.name] === option;
                                return (
                                    <button
                                        key={optIdx}
                                        onClick={() => handleOptionSelect(group.name, option)}
                                        className={`px-3 py-1 border rounded text-sm transition-colors ${isSelected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {option}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
                {/* Store status warning */}
                {product.store && !product.store.isActive && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            Cửa hàng này tạm thời đóng cửa và không nhận đơn hàng mới.
                        </p>
                    </div>
                )}
                <div className="mt-10">
                    {cart[selectedVariant ? `${productId}::${selectedVariant.id}` : productId] && (
                        <p className="text-lg text-slate-800 font-semibold mb-3">Số lượng</p>
                    )}
                    <div className="flex items-center gap-5">
                        {
                            cart[selectedVariant ? `${productId}::${selectedVariant.id}` : productId] && (
                                <Counter productId={productId} variantId={selectedVariant?.id} maxQuantity={selectedVariant ? selectedVariant.quantity : product.quantity} showStock={false} />
                            )
                        }
                        <button
                            onClick={() => {
                                const currentCartKey = selectedVariant ? `${productId}::${selectedVariant.id}` : productId;
                                if (cart[currentCartKey]) {
                                    session?.user ? router.push('/cart') : router.push('/login');
                                } else {
                                    addToCartHandler();
                                }
                            }}
                            className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
                            disabled={
                                (product.store && !product.store.isActive) ||
                                (selectedVariant ? selectedVariant.quantity === 0 : product.quantity === 0) ||
                                (hasVariations && !selectedVariant)
                            }
                        >
                            {(product.store && !product.store.isActive) ? 'Cửa hàng tạm đóng cửa' :
                                (selectedVariant ? selectedVariant.quantity : product.quantity) === 0 ? 'Hết hàng' :
                                    (!selectedVariant && hasVariations) ? 'Chọn tùy chọn' :
                                        (!cart[selectedVariant ? `${productId}::${selectedVariant.id}` : productId] ? 'Thêm vào giỏ' : 'Xem giỏ hàng')}
                        </button>
                    </div>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Miễn phí vận chuyển toàn quốc </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> Thanh toán an toàn 100% </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Được tin dùng bởi các thương hiệu hàng đầu </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails