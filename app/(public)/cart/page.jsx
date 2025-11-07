'use client'
import Counter from "@/components/Counter";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
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

        const fetchedProductsMap = {}
        // Build cart with products from store; fetch missing ones.
        await Promise.all(entries.map(async ([id, qty]) => {
            let prod = products.find(p => p.id === id)
            if (!prod) {
                try {
                    const res = await fetch(`/api/products/${id}`)
                    if (res.ok) {
                        prod = await res.json()
                        fetchedProductsMap[id] = prod
                    }
                } catch (_) {}
            }
        }))

        const result = []
        let total = 0
        for (const [id, qty] of entries) {
            const product = products.find(p => p.id === id) || fetchedProductsMap[id]
            if (product) {
                // Preserve stock quantity, add cart quantity separately
                result.push({ ...product, stock: product.quantity, cartQuantity: qty })
                total += product.price * qty
            }
        }
        setCartArray(result)
        setTotalPrice(total)
    }

    const handleDeleteItemFromCart = (productId) => {
        dispatch(deleteItemFromCart({ productId }))
        // Remove from selected items if it was selected
        setSelectedItems(prev => prev.filter(id => id !== productId))
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
            setSelectedItems(cartArray.map(item => item.id))
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
        toast.success('Order placed successfully! Items removed from cart.')
    }

    // Calculate total price based on selected items only
    const calculateSelectedTotal = () => {
        let total = 0
        cartArray.forEach(item => {
            if (selectedItems.includes(item.id)) {
                total += item.price * item.cartQuantity
            }
        })
        return total
    }

    const selectedCartItems = cartArray.filter(item => selectedItems.includes(item.id))
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
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="w-full max-w-4xl text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="w-10">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItems.length === cartArray.length && cartArray.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 cursor-pointer accent-slate-700"
                                        title="Select All"
                                    />
                                </th>
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th className="max-md:hidden">Remove</th>
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
                                        <tr key={index} className="space-x-2">
                                            <td className="text-center align-top pt-4">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => handleSelectItem(item.id)}
                                                    className="w-4 h-4 cursor-pointer accent-slate-700"
                                                />
                                            </td>
                                            <td className="flex gap-3 my-4">
                                                <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                                                    <Image src={item.images[0]} className="h-14 w-auto" alt="" width={45} height={45} />
                                                </div>
                                                <div>
                                                    <p className="max-sm:text-sm">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.category}</p>
                                                    {item.store?.name && (
                                                        <p className="text-xs text-blue-600 font-medium">Store: {item.store.name}</p>
                                                    )}
                                                    <p>{formatVND(item.price)}</p>
                                                    {isOutOfStock ? (
                                                        <p className="text-xs text-red-600 font-semibold mt-1">Out of stock</p>
                                                    ) : isOverStock ? (
                                                        <p className="text-xs text-orange-600 font-semibold mt-1">
                                                            Only {availableStock} available
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            {availableStock} in stock
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center align-top pt-4">
                                                <Counter productId={item.id} maxQuantity={availableStock} />
                                            </td>
                                            <td className="text-center align-top pt-4">{formatVND(item.price * cartQuantity)}</td>
                                            <td className="text-center max-md:hidden align-top pt-4">
                                                <button onClick={() => dispatch(deleteItemFromCart({ productId: item.id }))} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
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
                                <p className="font-medium">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</p>
                                <p className="text-xs mt-1">Total: {formatVND(selectedTotal)}</p>
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
            <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
        </div>
    )
}