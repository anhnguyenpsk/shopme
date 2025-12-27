'use client'
import Image from "next/image";
import Link from "next/link";
import { DotIcon, ExternalLinkIcon, StarIcon } from "lucide-react";
import { formatVND } from "@/lib/currency";
import { useState, useEffect, useCallback } from 'react';
import RatingModal from '@/components/products/RatingModal';

const statusStyles = (status) => {
  const s = (status || '').toLowerCase()
  if (s.includes('deliver') || s.includes('complete')) return 'text-green-600 bg-green-100'
  if (s.includes('confirm') || s.includes('process')) return 'text-yellow-600 bg-yellow-100'
  if (s.includes('cancel')) return 'text-red-600 bg-red-100'
  return 'text-slate-600 bg-slate-100'
}

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return ''
  }
}

const OrderItem = ({ order }) => {
  const total = order?.total || 0
  const address = order?.address
  const store = order?.store
  const [ratingModal, setRatingModal] = useState(null);
  const [userRatings, setUserRatings] = useState([]);

  const fetchUserRatings = useCallback(async () => {
    if (!order?.id) return;
    try {
      const res = await fetch(`/api/ratings?orderId=${order.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserRatings(data);
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    }
  }, [order?.id]);

  // Fetch user's ratings for this order
  useEffect(() => {
    if (order?.id && ['DELIVERED', 'COMPLETED'].includes(order?.status)) {
      fetchUserRatings();
    }
  }, [order?.id, order?.status, fetchUserRatings]);

  const hasRated = (productId) => {
    return userRatings.some(r => r.productId === productId && r.orderId === order.id);
  };

  const handleRatingSubmitted = () => {
    fetchUserRatings();
  };

  const [confirming, setConfirming] = useState(false);

  const handleConfirmOrder = async () => {
    if (!confirm('Bạn có chắc chắn đã nhận được đơn hàng này?')) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/confirm`, {
        method: 'POST',
      });
      if (res.ok) {
        window.location.reload(); // Simple reload to refresh state
      } else {
        alert('Không thể xác nhận đơn hàng');
      }
    } catch (error) {
      console.error('Error confirming order', error);
      alert('Lỗi khi xác nhận đơn hàng');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Mã đơn hàng</p>
            <p className="font-semibold text-slate-800 break-all">{order.id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Ngày đặt</p>
            <p className="text-slate-700">{formatDate(order.createdAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Trạng thái</p>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusStyles(order.status)}`}>
              <DotIcon size={12} />
              {ORDER_STATUS_VI[order.status] || order.status}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Tổng tiền</p>
            <p className="font-semibold text-slate-800">{formatVND(total)}</p>
          </div>
        </div>

        {/* Store Info */}
        {store && (
          <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                  <span className="text-slate-600 font-semibold text-sm">
                    {store.name?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500">Cửa hàng</p>
                <p className="font-semibold text-slate-700">{store.name}</p>
              </div>
            </div>
            {store.username && (
              <Link
                href={`/shop/${store.username}`}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                Xem Shop
                <ExternalLinkIcon size={14} />
              </Link>
            )}
          </div>
        )}

        {/* Address */}
        {address && (
          <div className="mt-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700 mb-1">Địa chỉ giao hàng</p>
            <p className="font-medium text-slate-800">{address.name}</p>
            <p>{address.phone}</p>
            <p>{address.street}</p>
            <p>
              {address.city}{address.state ? `, ${address.state}` : ''}
            </p>
            <p>{address.country}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="p-4 sm:p-6">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">Sản phẩm</th>
                <th className="py-2 pr-4">SL</th>
                <th className="py-2 pr-4">Đơn giá</th>
                <th className="py-2 pr-4">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item, idx) => (
                <tr key={idx} className="border-t border-slate-100">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                        <Image
                          className="h-full w-auto object-contain"
                          src={item.product.images[0]}
                          alt={item.product.name}
                          width={56}
                          height={56}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.product.name}</p>
                        {['DELIVERED', 'COMPLETED'].includes(order.status) && (
                          <div className="mt-1">
                            {hasRated(item.product.id) ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <StarIcon size={12} fill="#00C950" className="text-green-600" />
                                Đã đánh giá
                              </span>
                            ) : (
                              <button
                                onClick={() => setRatingModal({
                                  productId: item.product.id,
                                  orderId: order.id,
                                  productName: item.product.name
                                })}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                Đánh giá
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 pr-4">{formatVND(item.price)}</td>
                  <td className="py-3 pr-4">{formatVND(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {order.status === 'DELIVERED' && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={handleConfirmOrder}
            disabled={confirming}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {confirming ? 'Đang xác nhận...' : 'Đã nhận được hàng'}
          </button>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <RatingModal
          ratingModal={ratingModal}
          setRatingModal={setRatingModal}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </div>
  );
};

export default OrderItem