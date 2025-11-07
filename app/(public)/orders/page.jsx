'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";

export default function Orders() {

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch('/api/orders', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    setOrders(Array.isArray(data) ? data : [])
                }
            } catch (e) {
                console.error('Failed to fetch orders', e)
            }
        }
        load()
    }, []);

    return (
        <div className="min-h-[70vh] mx-6">
            {orders.length > 0 ? (
                (
                    <div className="my-20 max-w-7xl mx-auto">
                        <PageTitle heading="My Orders" text={`Showing total ${orders.length} orders`} linkText={'Go to home'} />

                        <div className="space-y-6">
                            {orders.map((order) => (
                                <OrderItem order={order} key={order.id} />
                            ))}
                        </div>
                    </div>
                )
            ) : (
                <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                    <h1 className="text-2xl sm:text-4xl font-semibold">You have no orders</h1>
                </div>
            )}
        </div>
    )
}