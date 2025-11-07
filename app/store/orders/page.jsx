'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"

import { formatVND } from "@/lib/utils/currency"

export default function StoreOrders() {

    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/store/orders');
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            } else {
                toast.error('Failed to fetch orders.');
            }
        } catch (error) {
            toast.error('An error occurred while fetching orders.');
        }
        setLoading(false);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch('/api/store/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, status: newStatus }),
            });

            if (response.ok) {
                toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
                fetchOrders(); // Refresh the order list
            } else {
                toast.error('Failed to update order status.');
            }
        } catch (error) {
            toast.error('An error occurred while updating the order.');
        }
    };

    const togglePaymentStatus = async (orderId, currentIsPaid) => {
        try {
            const response = await fetch('/api/store/orders', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, isPaid: !currentIsPaid }),
            });

            if (response.ok) {
                toast.success(`Payment status updated to ${!currentIsPaid ? 'Paid' : 'Unpaid'}`);
                fetchOrders(); // Refresh the order list
            } else {
                toast.error('Failed to update payment status.');
            }
        } catch (error) {
            toast.error('An error occurred while updating payment status.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ORDER_PLACED': return 'bg-blue-100 text-blue-800'
            case 'PROCESSING': return 'bg-yellow-100 text-yellow-800'
            case 'SHIPPED': return 'bg-purple-100 text-purple-800'
            case 'DELIVERED': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl mb-5">Store <span className="text-slate-800 font-medium">Orders</span></h1>
            
            <div className="space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-slate-800">Order #{order.id.slice(-8)}</h3>
                                <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {order.paymentMethod}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {order.isPaid ? 'Paid' : 'Unpaid'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-slate-800">{formatVND(order.total)}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="font-medium text-slate-700 mb-2">Items:</h4>
                            <div className="space-y-2">
                                {order.orderItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 text-sm">
                                        <Image 
                                            src={item.product.images[0]} 
                                            alt={item.product.name}
                                            width={40} 
                                            height={40} 
                                            className="rounded border"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.product.name}</p>
                                            <p className="text-slate-500">Qty: {item.quantity} × {formatVND(item.price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 text-sm">
                            <h4 className="font-medium text-slate-700 mb-1">Shipping Address:</h4>
                            <p className="text-slate-600">
                                {order.address.name}<br/>
                                {order.address.street}, {order.address.city}<br/>
                                {order.address.state} {order.address.zip}, {order.address.country}
                            </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <select 
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="px-3 py-1 border border-slate-200 rounded text-sm"
                            >
                                <option value="ORDER_PLACED">Order Placed</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                            {order.paymentMethod === 'COD' && (
                                <button
                                    onClick={() => togglePaymentStatus(order.id, order.isPaid)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                        order.isPaid 
                                            ? 'bg-green-600 text-white hover:bg-green-700' 
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                                >
                                    Mark as {order.isPaid ? 'Unpaid' : 'Paid'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
