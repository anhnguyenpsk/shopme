'use client'
import Counter from "@/components/shared/Counter";
import OrderSummary from "@/components/checkout/OrderSummary";
import PageTitle from "@/components/shared/PageTitle";
import { deleteItemFromCart, clearSelectedItems } from "@/lib/features/cart/cartSlice";
import { formatVND } from "@/lib/currency";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

export default function Cart() {

    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);

    const createCartArray = async () => {
        setTotalPrice(0);
        const entries = Object.entries(cartItems || {})
        if (entries.length === 0) {
            setCartArray([])
            return
        }

        // 1. Identify all Product IDs needed (extract from keys)
        const productIds = new Set();
        entries.forEach(([key]) => {
            const [pId] = key.split('::');
            productIds.add(pId);
        });

        const fetchedProductsMap = {}
        // 2. Fetch missing products
        await Promise.all(Array.from(productIds).map(async (id) => {
            let prod = products.find(p => p.id === id)
            if (!prod) {
                try {
                    const res = await fetch(`/api/products/${id}`)
                    if (res.ok) {
                        prod = await res.json()
                        fetchedProductsMap[id] = prod
                    }
                } catch (_) { }
            }
        }))

        const result = []
        let total = 0

        for (const [key, qty] of entries) {
            const [pId, vId] = key.split('::');
            const product = products.find(p => p.id === pId) || fetchedProductsMap[pId]

            if (product) {
                let item = {
                    ...product,
                    id: pId, // Base Product ID
                    cartKey: key, // Unique Key for Cart
                    cartQuantity: qty,
                    variantId: vId || null
                };

                if (vId && product.variants) {
                    const variant = product.variants.find(v => v.id === vId);
                    if (variant) {
                        item = {
                            ...item,
                            name: `${product.name}`, // Keep base name, show attrs separately
                            price: variant.price,
                            stock: variant.quantity,
                            images: Array.isArray(variant.images) && variant.images.length > 0 ? variant.images : item.images,
                            attributes: variant.attributes // { Color: Red }
                        }
                    } else {
                        // Variant not found? Fallback to product defaults but might be error
                        item.stock = 0; // Invalid variant
                    }
                } else {
                    item.stock = product.quantity;
                }

                result.push(item)
                total += item.price * qty
            }
        }
        setCartArray(result)
        setTotalPrice(total)
    }

    const handleDeleteItemFromCart = (key) => {
        const [productId, variantId] = key.split('::');
        dispatch(deleteItemFromCart({ productId, variantId }))
        // Remove from selected items if it was selected
        setSelectedItems(prev => prev.filter(id => id !== key))
    }

    const handleSelectItem = (productId) => {
        setSelectedItems(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId)
            } else {
                return [...prev, productId]
            }
        })
    }

    const handleSelectAll = () => {
        if (selectedItems.length === cartArray.length) {
            // Deselect all
            setSelectedItems([])
        } else {
            // Select all
            setSelectedItems(cartArray.map(item => item.cartKey))
        }
    }

    const handleOrderSuccess = (orders) => {
        // Extract all product IDs from all orders
        let allProductIds = []
        if (Array.isArray(orders)) {
            orders.forEach(order => {
                if (order.orderItems) {
                    const productIds = order.orderItems.map(item => item.productId)
                    allProductIds = [...allProductIds, ...productIds]
                }
            })
        }

        // Clear ordered items from cart
        if (allProductIds.length > 0) {
            dispatch(clearSelectedItems({ productIds: allProductIds }))
        }

        // Clear selection
        setSelectedItems([])
        toast.success('Đặt hàng thành công! Đã xóa sản phẩm khỏi giỏ hàng.')
    }

    // Calculate total price based on selected items only
    const calculateSelectedTotal = () => {
        let total = 0
        cartArray.forEach(item => {
            if (selectedItems.includes(item.cartKey)) {
                total += item.price * item.cartQuantity
            }
        })
        return total
    }

    const selectedCartItems = cartArray.filter(item => selectedItems.includes(item.cartKey))
    const selectedTotal = calculateSelectedTotal()

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="Giỏ hàng của tôi" text="sản phẩm trong giỏ" linkText="Thêm sản phẩm" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="w-full max-w-4xl text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm border-b border-slate-200">
                                <th className="w-10 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === cartArray.length && cartArray.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 cursor-pointer accent-slate-700"
                                        title="Select All"
                                    />
                                </th>
                                <th className="text-left py-3 px-4">Sản phẩm</th>
                                <th className="py-3 px-4 text-center">Số lượng</th>
                                <th className="py-3 px-4 text-center">Thành tiền</th>
                                <th className="max-md:hidden py-3 px-4 text-center">Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => {
                                    const availableStock = item.stock || 0;
                                    const cartQuantity = item.cartQuantity || 0;
                                    const isOverStock = cartQuantity > availableStock;
                                    const isOutOfStock = availableStock === 0;

                                    return (
                                        <tr key={index} className="space-x-2 border-b border-slate-50 last:border-0">
                                            <td className="text-center align-top pt-6 pb-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(item.cartKey)}
                                                    onChange={() => handleSelectItem(item.cartKey)}
                                                    className="w-4 h-4 cursor-pointer accent-slate-700 mt-2"
                                                />
                                            </td>
                                            <td className="flex gap-4 my-6 px-4">
                                                <div className="flex shrink-0 gap-3 items-center justify-center bg-slate-100 size-20 rounded-md">
                                                    <Image src={item.images[0]} className="h-16 w-auto object-contain" alt="" width={60} height={60} />
                                                </div>
                                                <div>
                                                    <p className="font-medium max-sm:text-sm text-slate-800 line-clamp-2">{item.name}</p>
                                                    {item.attributes && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {Object.entries(item.attributes).map(([key, val]) => (
                                                                <span key={key} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                                    {key}: {val}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.store?.name && (
                                                        <p className="text-xs text-blue-600 font-medium mt-1">Cửa hàng: {item.store.name}</p>
                                                    )}
                                                    <p className="mt-1 font-medium">{formatVND(item.price)}</p>
                                                    {isOutOfStock ? (
                                                        <p className="text-xs text-red-600 font-semibold mt-1">Hết hàng</p>
                                                    ) : isOverStock ? (
                                                        <p className="text-xs text-orange-600 font-semibold mt-1">
                                                            Chỉ còn {availableStock} sản phẩm
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Còn {availableStock} sản phẩm
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center align-top pt-6 px-4">
                                                <div className="flex justify-center">
                                                    <Counter productId={item.id} variantId={item.variantId} maxQuantity={availableStock} showStock={false} />
                                                </div>
                                            </td>
                                            <td className="text-center align-top pt-8 px-4 font-medium text-slate-800 whitespace-nowrap">{formatVND(item.price * cartQuantity)}</td>
                                            <td className="text-center max-md:hidden align-top pt-6 px-4">
                                                <button onClick={() => handleDeleteItemFromCart(item.cartKey)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all" title="Remove item">
                                                    <Trash2Icon size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                    <div className="w-full max-w-lg lg:max-w-[340px]">
                        {selectedItems.length > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                                <p className="font-medium">{selectedItems.length} sản phẩm đã chọn</p>
                                <p className="text-xs mt-1">Tổng cộng: {formatVND(selectedTotal)}</p>
                            </div>
                        )}
                        <OrderSummary
                            totalPrice={selectedTotal}
                            items={selectedCartItems}
                            onOrderSuccess={handleOrderSuccess}
                        />
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
            <h1 className="text-2xl sm:text-4xl font-semibold">Giỏ hàng của bạn đang trống</h1>
        </div>
    )
}