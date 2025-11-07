'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { useSession } from "next-auth/react"
import axios from "axios"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function StoreSettings() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        logo: "",
        isActive: false,
        status: ""
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const uploadLogo = async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload-store', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Upload failed')
        return data.path // relative path
    }

    const fetchStoreSettings = async () => {
        try {
            const { data } = await axios.get('/api/store/settings')
            if (data.store) {
                setStoreInfo({
                    name: data.store.name || "",
                    username: data.store.username || "",
                    description: data.store.description || "",
                    email: data.store.email || "",
                    contact: data.store.contact || "",
                    address: data.store.address || "",
                    logo: data.store.logo || "",
                    isActive: data.store.isActive || false,
                    status: data.store.status || ""
                })
            }
        } catch (error) {
            console.error("Error fetching store settings:", error)
            toast.error(error?.response?.data?.error || "Failed to load store settings")
        }
        setLoading(false)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        if (!session?.user?.id) {
            toast.error("You must be logged in to update store settings")
            setSubmitting(false)
            return
        }

        // Validate required fields
        if (!storeInfo.name || !storeInfo.description ||
            !storeInfo.email || !storeInfo.contact || !storeInfo.address || !storeInfo.logo) {
            toast.error("Please fill in all required fields")
            setSubmitting(false)
            return
        }

        try {
            const { data } = await axios.patch('/api/store/settings', {
                name: storeInfo.name,
                description: storeInfo.description,
                email: storeInfo.email,
                contact: storeInfo.contact,
                address: storeInfo.address,
                logo: storeInfo.logo,
                isActive: storeInfo.isActive
            })

            toast.success(data.message || "Store settings updated successfully")
            
            // Refresh store data
            if (data.store) {
                setStoreInfo(prev => ({
                    ...prev,
                    ...data.store
                }))
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message || "Failed to update settings")
        }
        setSubmitting(false)
    }

    useEffect(() => {
        if (session) {
            fetchStoreSettings()
        }
    }, [session])

    if (!session) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center text-slate-400">
                <h1 className="text-2xl sm:text-4xl font-semibold">
                    Please <span className="text-slate-500">Login</span> to Continue
                </h1>
            </div>
        )
    }

    return loading ? (
        <Loading />
    ) : (
        <div className="max-w-4xl">
            <form onSubmit={onSubmitHandler} className="flex flex-col items-start gap-3 text-slate-500">
                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-3xl text-slate-800 font-medium">Store Settings</h1>
                    <p className="max-w-lg mt-2">Update your store information and manage your store status.</p>
                </div>

                {/* Store Status Card */}
                <div className="w-full max-w-lg border border-slate-300 rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Approval Status</p>
                            <span className={`inline-block mt-1 px-3 py-1 text-sm rounded-full ${
                                storeInfo.status === 'approved' ? 'bg-green-100 text-green-800' :
                                storeInfo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {storeInfo.status?.charAt(0).toUpperCase() + storeInfo.status?.slice(1)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                            <div className="space-y-0.5">
                                <Label htmlFor="store-active" className="text-sm font-medium text-slate-600">
                                    Store Active Status
                                </Label>
                                <p className="text-xs text-slate-400">
                                    {storeInfo.isActive ? 'Your store is currently active and visible to customers' : 'Your store is currently inactive'}
                                </p>
                            </div>
                            <Switch
                                id="store-active"
                                checked={storeInfo.isActive}
                                onCheckedChange={(checked) => setStoreInfo({ ...storeInfo, isActive: checked })}
                            />
                        </div>
                    </div>
                </div>

                {/* Username (Read-only) */}
                <p className="font-medium">Username</p>
                <input
                    name="username"
                    value={storeInfo.username}
                    type="text"
                    disabled
                    className="border border-slate-300 bg-slate-100 w-full max-w-lg p-2 rounded cursor-not-allowed text-slate-500"
                />
                <p className="text-xs text-slate-400 -mt-2">Username cannot be changed</p>

                {/* Store Logo */}
                <label className="mt-4 cursor-pointer">
                    <p className="font-medium mb-2">Store Logo *</p>
                    {storeInfo.logo ? (
                        <Image 
                            src={storeInfo.logo} 
                            className="rounded-lg mt-2 h-20 w-auto object-cover border border-slate-300" 
                            alt="Store logo" 
                            width={150} 
                            height={100}
                            unoptimized
                        />
                    ) : (
                        <Image 
                            src={assets.upload_area} 
                            className="rounded-lg mt-2 h-20 w-auto" 
                            alt="Upload logo" 
                            width={150} 
                            height={100} 
                        />
                    )}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            try {
                                toast.loading('Uploading logo...', { id: 'upload' })
                                const path = await uploadLogo(f)
                                setStoreInfo({ ...storeInfo, logo: path })
                                toast.success('Logo uploaded', { id: 'upload' })
                            } catch (err) {
                                toast.error(err.message || 'Upload failed', { id: 'upload' })
                            }
                        }} 
                        hidden 
                    />
                </label>

                {/* Name */}
                <p className="mt-4 font-medium">Name *</p>
                <input
                    name="name"
                    onChange={onChangeHandler}
                    value={storeInfo.name}
                    type="text"
                    placeholder="Enter your store name"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                    required
                />

                {/* Description */}
                <p className="mt-4 font-medium">Description *</p>
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={storeInfo.description}
                    rows={5}
                    placeholder="Enter your store description"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
                    required
                />

                {/* Email */}
                <p className="mt-4 font-medium">Email *</p>
                <input
                    name="email"
                    onChange={onChangeHandler}
                    value={storeInfo.email}
                    type="email"
                    placeholder="Enter your store email"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                    required
                />

                {/* Contact */}
                <p className="mt-4 font-medium">Contact Number *</p>
                <input
                    name="contact"
                    onChange={onChangeHandler}
                    value={storeInfo.contact}
                    type="text"
                    placeholder="Enter your store contact number"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                    required
                />

                {/* Address */}
                <p className="mt-4 font-medium">Address *</p>
                <textarea
                    name="address"
                    onChange={onChangeHandler}
                    value={storeInfo.address}
                    rows={5}
                    placeholder="Enter your store address"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
                    required
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    className="bg-slate-800 text-white px-12 py-2 rounded mt-6 mb-20 active:scale-95 hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || !storeInfo.name || !storeInfo.description || !storeInfo.email || !storeInfo.contact || !storeInfo.address || !storeInfo.logo}
                >
                    {submitting ? 'Updating...' : 'Update Settings'}
                </button>
            </form>
        </div>
    )
}

