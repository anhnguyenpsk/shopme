'use client'
import { XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { addAddress, setSelectedAddress, updateAddress as updateAddressAction } from "@/lib/features/address/addressSlice"

const AddressModal = ({ setShowAddressModal, initialAddress = null, onSaved }) => {

    const dispatch = useDispatch()

    const [address, setAddress] = useState({
        id: '',
        name: '',
        street: '',
        city: '',
        state: '',
        country: '',
        phone: ''
    })

    useEffect(() => {
        if (initialAddress) {
            setAddress({ ...initialAddress })
        }
    }, [initialAddress])

    const handleAddressChange = (e) => {
        setAddress({
            ...address,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const isEdit = !!address.id
        const url = isEdit ? `/api/addresses/${address.id}` : '/api/addresses'
        const method = isEdit ? 'PATCH' : 'POST'
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: address.name,
                street: address.street,
                city: address.city,
                state: address.state,
                country: address.country,
                phone: address.phone,
            })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            throw new Error(data?.error || (isEdit ? 'Failed to update address' : 'Failed to create address'))
        }
        if (isEdit) {
            dispatch(updateAddressAction({ id: data.id, updates: data }))
        } else {
            dispatch(addAddress(data))
        }
        dispatch(setSelectedAddress(data))
        onSaved?.(data)
        toast.success(isEdit ? "Address updated successfully!" : "Address added successfully!")
        setShowAddressModal(false)
    }

    return (
        <form onSubmit={e => toast.promise(handleSubmit(e), { loading: (address.id ? 'Updating' : 'Adding') + ' Address...' })} className="fixed inset-0 z-50 bg-white/60 backdrop-blur h-screen flex items-center justify-center">
            <div className="flex flex-col gap-5 text-slate-700 w-full max-w-sm mx-6">
                <h2 className="text-3xl ">{address.id ? 'Edit' : 'Add New'} <span className="font-semibold">Address</span></h2>
                <input name="name" onChange={handleAddressChange} value={address.name} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Recipient name" required />
                <input name="phone" onChange={handleAddressChange} value={address.phone} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="tel" placeholder="Phone number" required />
                <input name="street" onChange={handleAddressChange} value={address.street} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Street address" required />
                <div className="flex gap-4">
                    <input name="city" onChange={handleAddressChange} value={address.city} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="City" required />
                    <input name="state" onChange={handleAddressChange} value={address.state} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="State/Province" required />
                </div>
                <input name="country" onChange={handleAddressChange} value={address.country} className="p-2 px-4 outline-none border border-slate-200 rounded w-full" type="text" placeholder="Country" required />
                <button className="bg-slate-800 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-900 active:scale-95 transition-all">SAVE ADDRESS</button>
            </div>
            <XIcon size={30} className="absolute top-5 right-5 text-slate-500 hover:text-slate-700 cursor-pointer" onClick={() => setShowAddressModal(false)} />
        </form>
    )
}

export default AddressModal
