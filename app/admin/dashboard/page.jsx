'use client'
import Loading from "@/components/shared/Loading"
import OrdersAreaChart from "@/components/analytics/OrdersAreaChart"
import { formatVND } from "@/lib/utils/currency"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminDashboard() {

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        allOrders: [],
    })

    const dashboardCardsData = [
        { title: 'Tổng sản phẩm', value: dashboardData.products, icon: ShoppingBasketIcon },
        { title: 'Tổng doanh thu', value: formatVND(dashboardData.revenue), icon: CircleDollarSignIcon },
        { title: 'Tổng đơn hàng', value: dashboardData.orders, icon: TagsIcon },
        { title: 'Tổng cửa hàng', value: dashboardData.stores, icon: StoreIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard');
            if (response.ok) {
                const data = await response.json();
                setDashboardData({
                    products: data.products || 0,
                    revenue: data.revenue || 0,
                    orders: data.orders || 0,
                    stores: data.stores || 0,
                    allOrders: data.allOrders || []
                });
            } else {
                console.error('Failed to fetch admin dashboard data');
                toast.error('Không thể tải dữ liệu bảng điều khiển');
            }
        } catch (error) {
            console.error('Error fetching admin dashboard data:', error);
            toast.error('Lỗi khi tải bảng điều khiển');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className="text-slate-500">
            <h1 className="text-2xl">Bảng điều khiển <span className="text-slate-800 font-medium">Admin</span></h1>

            {/* Cards */}
            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-10 border border-slate-200 p-3 px-6 rounded-lg">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className=" w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            {/* Area Chart */}
            <OrdersAreaChart allOrders={dashboardData.allOrders} />
        </div>
    )
}






