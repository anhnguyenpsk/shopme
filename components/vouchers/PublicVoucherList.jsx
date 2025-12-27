'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatVND } from '@/lib/currency';

const PublicVoucher = ({ voucher, onCollect, collectedVouchers }) => {
  const isCollected = collectedVouchers.includes(voucher.id);
  const [isCollecting, setIsCollecting] = useState(false);

  const handleCollect = async () => {
    setIsCollecting(true);
    await onCollect(voucher.id);
    setIsCollecting(false);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
      <div className="flex items-center gap-3">
        <Ticket className="h-8 w-8 text-green-600" />
        <div>
          <p className="font-semibold text-slate-800 text-sm">{voucher.description || voucher.name}</p>
          <p className="text-xs text-slate-500">
            {voucher.discount_type === 'PERCENTAGE'
              ? `Giảm ${voucher.discount_value}%, tối đa ${formatVND(voucher.max_discount_amount)}`
              : `Giảm ${formatVND(voucher.discount_value)}`}
          </p>
          <p className="text-xs text-slate-500">Đơn tối thiểu: {formatVND(voucher.min_order_value)}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isCollected ? "outline" : "default"}
        onClick={handleCollect}
        disabled={isCollected || isCollecting}
      >
        {isCollecting ? 'Đang lưu...' : (isCollected ? 'Đã lưu' : 'Lưu')}
      </Button>
    </div>
  );
};

export default function PublicVoucherList({ storeId, productId }) {
  const { data: session, status } = useSession();
  const [vouchers, setVouchers] = useState([]);
  const [collectedVouchers, setCollectedVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const params = new URLSearchParams();
        // API requires either storeId OR productId, not both
        // Prefer productId as the API can look up the store from it
        if (productId) {
          params.append('productId', productId);
        } else if (storeId) {
          params.append('storeId', storeId);
        }

        const response = await axios.get(`/api/vouchers/public?${params.toString()}`);
        setVouchers(response.data.vouchers || []);
      } catch (error) {
        console.error("Failed to fetch public vouchers", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [storeId, productId]);

  useEffect(() => {
    const fetchUserVouchers = async () => {
      if (status !== 'authenticated' || !session) return;

      try {
        const response = await axios.get('/api/user/vouchers');
        const userVoucherIds = (response.data.vouchers || []).map(uv => uv.voucher_campaign_id);
        setCollectedVouchers(userVoucherIds);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log("User session invalid or expired during voucher fetch");
          return;
        }
        console.error("Failed to fetch user vouchers", error);
      }
    };
    fetchUserVouchers();
  }, [session, status]);

  const handleCollectVoucher = async (voucherCampaignId) => {
    if (!session) {
      toast.error('Bạn cần đăng nhập để lưu voucher.');
      return;
    }
    try {
      await axios.post('/api/user/vouchers', { voucher_campaign_id: voucherCampaignId });
      toast.success('Lưu voucher thành công!');
      setCollectedVouchers(prev => [...prev, voucherCampaignId]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu voucher thất bại.');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Đang tải voucher...</div>;
  }

  if (vouchers.length === 0) {
    return null; // Don't render anything if there are no vouchers
  }

  return (
    <div className="max-w-7xl mx-auto mt-6">
      <div className="space-y-3">
        {vouchers.map(voucher => (
          <PublicVoucher
            key={voucher.id}
            voucher={voucher}
            onCollect={handleCollectVoucher}
            collectedVouchers={collectedVouchers}
          />
        ))}
      </div>
    </div>
  );
}
