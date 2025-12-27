'use client'

import StoreInfo from "@/components/admin/StoreInfo"
import Loading from "@/components/shared/Loading"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function AdminApprove() {

    const [stores, setStores] = useState([])
    const [loading, setLoading] = useState(true)


    const fetchStores = async () => {
        try {
            const response = await fetch('/api/admin/stores?status=pending');
            if (response.ok) {
                const data = await response.json();
                setStores(data);
            } else {
                toast.error('Failed to fetch store applications.');
            }
        } catch (error) {
            toast.error('An error occurred while fetching applications.');
            console.error(error);
        }
        setLoading(false);
    };

    const handleApprove = async ({ storeId, status }) => {
        try {
            const response = await fetch(`/api/admin/stores/${storeId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                toast.success(`Cửa hàng đã được ${status === 'approved' ? 'chấp thuận' : 'từ chối'}.`);
                // Refresh the list of pending stores
                fetchStores();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Lỗi khi cập nhật trạng thái cửa hàng.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        }
    };

    useEffect(() => {
        fetchStores()
    }, [])

    return !loading ? (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Duyệt <span className="text-slate-800 font-medium">Cửa hàng</span></h1>

            {stores.length ? (
                <div className="flex flex-col gap-4 mt-4">
                    {stores.map((store) => (
                        <div key={store.id} className="bg-white border rounded-lg shadow-sm p-6 flex max-md:flex-col gap-4 md:items-end max-w-4xl" >
                            {/* Store Info */}
                            <StoreInfo store={store} />

                            {/* Actions */}
                            <div className="flex gap-3 pt-2 flex-wrap">
                                <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'approved' }), { loading: "Đang chấp thuận..." })} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm" >
                                    Chấp thuận
                                </button>
                                <button onClick={() => toast.promise(handleApprove({ storeId: store.id, status: 'rejected' }), { loading: 'Đang từ chối...' })} className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 text-sm" >
                                    Từ chối
                                </button>
                            </div>
                        </div>
                    ))}

                </div>) : (
                <div className="flex items-center justify-center h-80">
                    <h1 className="text-3xl text-slate-400 font-medium">Không có đơn đăng ký nào đang chờ</h1>
                </div>
            )}
        </div>
    ) : <Loading />
}