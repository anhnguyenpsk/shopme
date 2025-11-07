import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatVND } from '../lib/currency';
import StripePayment from './StripePayment';
import { setAddresses, setSelectedAddress, deleteAddress as deleteAddressAction } from '@/lib/features/address/addressSlice';

const OrderSummary = ({ totalPrice, items, onOrderSuccess }) => {

    const router = useRouter();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address?.addresses) || [];
    const selectedAddress = useSelector(state => state.address?.selectedAddress) || null;

    useEffect(() => {
        // Load addresses from backend once when component mounts
        const loadAddresses = async () => {
            try {
                const res = await fetch('/api/addresses', { cache: 'no-store' })
                if (res.ok) {
                    const data = await res.json()
                    dispatch(setAddresses(Array.isArray(data) ? data : []))
                }
            } catch (e) {
                console.error('Failed to load addresses', e)
            }
        }
        loadAddresses()
    }, [dispatch])

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');

    const handleCouponCode = async (event) => {
        event.preventDefault();

    }

    const finalizeOrder = async (isPaid, paymentIntentId = null) => {
        if (!selectedAddress?.id) {
            throw new Error('Please select a shipping address')
        }
        const payload = {
            items: items.map(i => ({ productId: i.id, quantity: i.cartQuantity, price: i.price })),
            addressId: selectedAddress.id,
            total: payableTotal,
            paymentMethod: paymentMethod === 'STRIPE' ? 'STRIPE' : 'COD',
            isPaid: !!isPaid,
            coupon: coupon || null,
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

    const subTotal = totalPrice;
    const discount = coupon ? (coupon.discount / 100 * totalPrice) : 0;
    const payableTotal = Math.max(0, Math.round(subTotal - discount));

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="STRIPE" name='payment' onChange={() => setPaymentMethod('STRIPE')} checked={paymentMethod === 'STRIPE'} className='accent-gray-500' />
                <label htmlFor="STRIPE" className='cursor-pointer'>Stripe Payment</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                <div className='mt-2'>
                    {addressList.length > 0 && (
                        <div className='flex gap-2 items-center'>
                            <select
                                className='border border-slate-400 p-2 w-full my-1 outline-none rounded'
                                value={selectedAddress ? String(addressList.findIndex(a => a.id === selectedAddress.id)) : ''}
                                onChange={(e) => dispatch(setSelectedAddress(addressList[e.target.value]))}
                            >
                                <option value="">Select Address</option>
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
                                        title='Edit address'
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type='button'
                                        onClick={async () => {
                                            if (!confirm('Delete this address?')) return;
                                            try {
                                                const res = await fetch(`/api/addresses/${selectedAddress.id}`, { method: 'DELETE' })
                                                if (!res.ok) {
                                                    const d = await res.json().catch(() => ({}))
                                                    throw new Error(d?.error || 'Failed to delete')
                                                }
                                                dispatch(deleteAddressAction(selectedAddress.id))
                                                dispatch(setSelectedAddress(null))
                                                toast.success('Address deleted')
                                            } catch (err) {
                                                toast.error(err.message || 'Delete failed')
                                            }
                                        }}
                                        className='px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50'
                                        title='Delete address'
                                    >
                                        Delete
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
                    
                    <button className='flex items-center gap-1 text-slate-600 mt-2' onClick={() => { setEditingAddress(null); setShowAddressModal(true) }} >Add Address <PlusIcon size={18} /></button>
                </div>
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{formatVND(totalPrice)}</p>
                        <p>Free</p>
                        {coupon && <p>{`-${formatVND(coupon.discount / 100 * totalPrice)}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>{formatVND(payableTotal)}</p>
            </div>

            {!selectedAddress && (
                <p className='text-xs text-red-600 mb-2'>Please select or add a shipping address to continue.</p>
            )}
            
            {items.length === 0 && (
                <p className='text-xs text-orange-600 mb-2'>Please select at least one item from your cart to place an order.</p>
            )}

            {paymentMethod === 'STRIPE' ? (
                <div className='mt-2'>
                    <StripePayment
                        amount={payableTotal}
                        addressId={selectedAddress?.id}
                        items={items.map(i => ({ productId: i.id, quantity: i.cartQuantity, price: i.price }))}
                        coupon={coupon || null}
                        onSuccess={async (paymentIntent) => {
                            try {
                                // Create orders (may be multiple for multi-store) immediately after successful payment
                                const orders = await finalizeOrder(true, paymentIntent.id);
                                
                                // Call the callback with the orders array
                                if (onOrderSuccess) {
                                    onOrderSuccess(orders)
                                }
                                
                                toast.success('Payment successful! Order placed.');
                                router.push('/orders');
                            } catch (err) {
                                toast.error(err.message || 'Failed to create order');
                            }
                        }}
                    />
                </div>
            ) : (
                <button disabled={!selectedAddress || items.length === 0} onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'Placing order...' })} className='w-full disabled:opacity-60 disabled:cursor-not-allowed bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Place Order</button>
            )}

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} initialAddress={editingAddress} onSaved={(addr) => dispatch(setSelectedAddress(addr))} />}

        </div>
    )
}

export default OrderSummary