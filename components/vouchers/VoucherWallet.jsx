'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, History, XCircle } from 'lucide-react';
import { formatVND } from '@/lib/currency';
import Loading from '@/components/Loading';

const TABS = [
  { name: 'Available', status: 'AVAILABLE', icon: Ticket },
  { name: 'Used', status: 'USED', icon: History },
  { name: 'Expired', status: 'EXPIRED', icon: XCircle },
];

const VoucherCard = ({ userVoucher }) => {
    const { voucherCampaign: voucher } = userVoucher;
    const isExpired = new Date(voucher.end_date) < new Date();
    const statusColor = userVoucher.status === 'AVAILABLE' && !isExpired 
        ? 'border-green-500' 
        : 'border-slate-300';
    const textColor = userVoucher.status === 'AVAILABLE' && !isExpired
        ? 'text-green-600'
        : 'text-slate-400';

    return (
        <div className={`relative flex items-center gap-4 p-4 bg-white border-l-8 rounded-lg shadow-sm ${statusColor}`}>
            <div className={`flex-shrink-0 ${textColor}`}>
                <Ticket size={40} />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-slate-800">{voucher.description || voucher.name}</p>
                <p className="text-sm text-slate-600">
                    {voucher.discount_type === 'PERCENTAGE'
                        ? `Save ${voucher.discount_value}%, max ${formatVND(voucher.max_discount_amount)}`
                        : `Save ${formatVND(voucher.discount_value)}`}
                </p>
                <p className="text-xs text-slate-500 mt-1">Min. order: {formatVND(voucher.min_order_value)}</p>
                <p className="text-xs text-slate-500">Expires: {new Date(voucher.end_date).toLocaleDateString('en-US')}</p>
            </div>
            {userVoucher.status !== 'AVAILABLE' && (
                 <div className="absolute top-2 right-2 text-xs font-bold text-white bg-slate-400 px-2 py-1 rounded">
                    {userVoucher.status}
                </div>
            )}
        </div>
    );
};


export default function VoucherWallet() {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState('AVAILABLE');
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const fetchVouchers = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/user/vouchers?status=${activeTab}`);
          setVouchers(response.data.data || []);
        } catch (error) {
          console.error(`Failed to fetch ${activeTab} vouchers`, error);
        } finally {
          setLoading(false);
        }
      };
      fetchVouchers();
    }
  }, [sessionStatus, activeTab]);

  if (sessionStatus === 'loading') {
    return <Loading />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Voucher Wallet</CardTitle>
        <CardDescription>Manage and review the vouchers you have collected.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-b mb-4">
          <nav className="-mb-px flex space-x-6">
            {TABS.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.status)}
                className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.status
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loading />
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p>No vouchers in this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vouchers.map((uv) => (
              <VoucherCard key={uv.id} userVoucher={uv} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
