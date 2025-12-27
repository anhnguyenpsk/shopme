import { PlusIcon, TicketIcon, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react';
import AddressModal from '@/components/shared/AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatVND } from '@/lib/currency';
import StripePayment from './StripePayment';
import { setAddresses, setSelectedAddress, deleteAddress as deleteAddressAction } from '@/lib/features/address/addressSlice';
import VoucherSelectionModal from '@/components/vouchers/VoucherSelectionModal';
import { Button } from '@/components/ui/button';
import { PAYMENT_METHOD_VI } from '@/lib/translations';

const OrderSummary = ({ totalPrice, items, onOrderSuccess }) => {

    const router = useRouter();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address?.addresses) || [];
    const selectedAddress = useSelector(state => state.address?.selectedAddress) || null;
    const cartItems = useSelector(state => state.cart.items);


    const { data: session, status } = useSession();

    useEffect(() => {
        // Load addresses from backend once when component mounts and user is authenticated
        const loadAddresses = async () => {
            if (status !== 'authenticated') return;

            try {
                const res = await fetch('/api/addresses', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    dispatch(setAddresses(Array.isArray(data) ? data : []))
                } else {
                    if (res.status === 401) {
                        // clear addresses if unauthorized
                        dispatch(setAddresses([]))
                    }
                }
            } catch (e) {
                console.error('Failed to load addresses', e)
            }
        }
        loadAddresses()
    }, [dispatch, status])

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // New Voucher State
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [selectedVouchers, setSelectedVouchers] = useState({ SHOP: null, PLATFORM: null, SHIPPING: null });


    const finalizeOrder = async (isPaid, paymentIntentId = null) => {
        if (!selectedAddress?.id) {
            throw new Error('Please select a shipping address')
        }
        const payload = {
            items: items.map(i => ({ productId: i.id, quantity: i.cartQuantity, price: i.price, variantId: i.variantId || null })),
            addressId: selectedAddress.id,
            total: payableTotal,
            paymentMethod: paymentMethod === 'STRIPE' ? 'STRIPE' : 'COD',
            isPaid: !!isPaid,
            userVoucherIds: Object.values(selectedVouchers).filter(Boolean).map(v => v.userVoucherId),
            paymentIntentId: paymentIntentId || null,
        }
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data?.error || 'Failed to create order')
        }
        return res.json()
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        // COD: create orders (may be multiple for multi-store) as unpaid then redirect
        const orders = await finalizeOrder(false)

        // Call the callback with the orders array
        if (onOrderSuccess) {
            onOrderSuccess(orders)
        }

        router.push('/orders')
    }

    const handlePlaceFreeOrder = async (e) => {
        e.preventDefault();
        // For 100% discounted orders, finalize as PAID
        const orders = await finalizeOrder(true);
        if (onOrderSuccess) {
            onOrderSuccess(orders);
        }
        if (onOrderSuccess) {
            onOrderSuccess(orders);
        }
        toast.success('Đặt hàng thành công!');
        router.push('/orders');
    }

    const subTotal = totalPrice;
    const totalDiscount = Object.values(selectedVouchers).reduce((acc, v) => acc + (v?.discountAmount || 0), 0);
    const payableTotal = Math.max(0, Math.round(subTotal - totalDiscount));

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Tóm tắt đơn hàng</h2>

            {payableTotal > 0 && (
                <>
                    <p className='text-slate-400 text-xs my-4'>Phương thức thanh toán</p>
                    <div className='flex gap-2 items-center'>
                        <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                        <label htmlFor="COD" className='cursor-pointer'>{PAYMENT_METHOD_VI.COD}</label>
                    </div>
                    <div className='flex gap-2 items-center mt-1'>
                        <input type="radio" id="STRIPE" name='payment' onChange={() => setPaymentMethod('STRIPE')} checked={paymentMethod === 'STRIPE'} className='accent-gray-500' />
                        <label htmlFor="STRIPE" className='cursor-pointer'>{PAYMENT_METHOD_VI.STRIPE}</label>
                    </div>
                </>
            )}

            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Địa chỉ</p>
                <div className='mt-2'>
                    {addressList.length > 0 && (
                        <div className='flex gap-2 items-center'>
                            <select
                                className='border border-slate-400 p-2 w-full my-1 outline-none rounded'
                                value={selectedAddress ? String(addressList.findIndex(a => a.id === selectedAddress.id)) : ''}
                                onChange={(e) => dispatch(setSelectedAddress(addressList[e.target.value]))}
                            >
                                <option value="">Chọn địa chỉ</option>
                                {addressList.map((address, index) => (
                                    <option key={address.id || index} value={index}>
                                        {address.name} - {address.street}, {address.city}, {address.state}, {address.country}
                                    </option>
                                ))}
                            </select>
                            {selectedAddress && (
                                <>
                                    <button
                                        type='button'
                                        onClick={() => { setEditingAddress(selectedAddress); setShowAddressModal(true) }}
                                        className='px-2 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-100'
                                        title='Chỉnh sửa địa chỉ'
                                    >
                                        Sửa
                                    </button>
                                    <button
                                        type='button'
                                        onClick={async () => {
                                            if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
                                            try {
                                                const res = await fetch(`/api/addresses/${selectedAddress.id}`, { method: 'DELETE' })
                                                if (!res.ok) {
                                                    const d = await res.json().catch(() => ({}))
                                                    throw new Error(d?.error || 'Xóa thất bại')
                                                }
                                                dispatch(deleteAddressAction(selectedAddress.id))
                                                dispatch(setSelectedAddress(null))
                                                toast.success('Đã xóa địa chỉ')
                                            } catch (err) {
                                                toast.error(err.message || 'Xóa thất bại')
                                            }
                                        }}
                                        className='px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50'
                                        title='Xóa địa chỉ'
                                    >
                                        Xóa
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {selectedAddress && (
                        <div className='mt-3 p-3 bg-white border border-slate-200 rounded text-xs'>
                            <p className='font-semibold text-slate-700'>{selectedAddress.name}</p>
                            <p className='text-slate-600 mt-1'>{selectedAddress.phone}</p>
                            <p className='text-slate-600 mt-1'>{selectedAddress.street}</p>
                            <p className='text-slate-600'>{selectedAddress.city}, {selectedAddress.state}</p>
                            <p className='text-slate-600'>{selectedAddress.country}</p>
                        </div>
                    )}

                    <button className='flex items-center gap-1 text-slate-600 mt-2' onClick={() => { setEditingAddress(null); setShowAddressModal(true) }} >Thêm địa chỉ <PlusIcon size={18} /></button>
                </div>
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Tạm tính:</p>
                        <p>Phí vận chuyển:</p>
                        {totalDiscount > 0 && <p>Giảm giá Voucher:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{formatVND(totalPrice)}</p>
                        <p>Miễn phí</p>
                        {totalDiscount > 0 && <p className='text-green-600'>{`-${formatVND(totalDiscount)}`}</p>}
                    </div>
                </div>
                <div className='mt-3'>
                    <Button variant="outline" className="w-full" onClick={() => setIsVoucherModalOpen(true)}>
                        <TicketIcon className="w-4 h-4 mr-2" />
                        Chọn hoặc nhập Voucher
                    </Button>
                </div>
            </div>
            <div className='flex justify-between py-4'>
                <p>Tổng cộng:</p>
                <p className='font-medium text-right'>{formatVND(payableTotal)}</p>
            </div>

            {!selectedAddress && (
                <p className='text-xs text-red-600 mb-2'>Vui lòng chọn hoặc thêm địa chỉ nhận hàng để tiếp tục.</p>
            )}

            {items.length === 0 && (
                <p className='text-xs text-orange-600 mb-2'>Vui lòng chọn ít nhất một sản phẩm để đặt hàng.</p>
            )}

            {payableTotal <= 0 ? (
                <button disabled={!selectedAddress || items.length === 0} onClick={e => toast.promise(handlePlaceFreeOrder(e), { loading: 'Đang đặt hàng...' })} className='w-full disabled:opacity-60 disabled:cursor-not-allowed bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Đặt hàng</button>
            ) : paymentMethod === 'STRIPE' ? (
                <div className='mt-2'>
                    <StripePayment
                        amount={payableTotal}
                        addressId={selectedAddress?.id}
                        items={items.map(i => ({ productId: i.id, quantity: i.cartQuantity, price: i.price, variantId: i.variantId || null }))}
                        userVoucherIds={Object.values(selectedVouchers).filter(Boolean).map(v => v.userVoucherId)}
                        onSuccess={async (paymentIntent) => {
                            try {
                                // Create orders (may be multiple for multi-store) immediately after successful payment
                                const orders = await finalizeOrder(true, paymentIntent.id);

                                // Call the callback with the orders array
                                if (onOrderSuccess) {
                                    onOrderSuccess(orders)
                                }

                                toast.success('Thanh toán thành công! Đơn hàng đã được tạo.');
                                router.push('/orders');
                            } catch (err) {
                                toast.error(err.message || 'Tạo đơn hàng thất bại');
                            }
                        }}
                    />
                </div>
            ) : (
                <button disabled={!selectedAddress || items.length === 0} onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'Đang đặt hàng...' })} className='w-full disabled:opacity-60 disabled:cursor-not-allowed bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Đặt hàng</button>
            )}

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} initialAddress={editingAddress} onSaved={(addr) => dispatch(setSelectedAddress(addr))} />}

            <VoucherSelectionModal
                open={isVoucherModalOpen}
                onOpenChange={setIsVoucherModalOpen}
                cartItems={cartItems}
                initialSelectedVouchers={selectedVouchers}
                onApply={setSelectedVouchers}
            />

        </div>
    )
}

export default OrderSummary