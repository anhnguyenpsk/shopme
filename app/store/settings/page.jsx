'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/shared/Loading"
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
        if (!res.ok) throw new Error(data?.error || 'Tải ảnh lên thất bại')
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
            toast.error(error?.response?.data?.error || "Không thể tải cấu hình cửa hàng")
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
            toast.error("Vui lòng điền đầy đủ các thông tin cần thiết")
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

            toast.success(data.message || "Cập nhật cài đặt cửa hàng thành công")

            // Refresh store data
            if (data.store) {
                setStoreInfo(prev => ({
                    ...prev,
                    ...data.store
                }))
            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message || "Lỗi khi cập nhật cài đặt")
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
                    <h1 className="text-3xl text-slate-800 font-medium">Cài đặt Cửa hàng</h1>
                    <p className="max-w-lg mt-2">Cập nhật thông tin cửa hàng và quản lý trạng thái.</p>
                </div>

                {/* Store Status Card */}
                <div className="w-full max-w-lg border border-slate-300 rounded-lg p-4 mb-4">
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Trạng thái phê duyệt</p>
                            <span className={`inline-block mt-1 px-3 py-1 text-sm rounded-full ${storeInfo.status === 'approved' ? 'bg-green-100 text-green-800' :
                                storeInfo.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                {storeInfo.status === 'approved' ? 'Đã duyệt' : storeInfo.status === 'pending' ? 'Đang chờ' : 'Từ chối'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                            <div className="space-y-0.5">
                                <Label htmlFor="store-active" className="text-sm font-medium text-slate-600">
                                    Trạng thái hoạt động
                                </Label>
                                <p className="text-xs text-slate-400">
                                    {storeInfo.isActive ? 'Cửa hàng đang hiển thị với khách hàng' : 'Cửa hàng đang tạm dừng hoạt động'}
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
                <p className="font-medium">Tên đăng nhập</p>
                <input
                    name="username"
                    value={storeInfo.username}
                    type="text"
                    disabled
                    className="border border-slate-300 bg-slate-100 w-full max-w-lg p-2 rounded cursor-not-allowed text-slate-500"
                />
                <p className="text-xs text-slate-400 -mt-2">Không thể đổi tên đăng nhập</p>

                {/* Store Logo */}
                <label className="mt-4 cursor-pointer">
                    <p className="font-medium mb-2">Logo Cửa hàng *</p>
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
                                toast.loading('Đang tải logo...', { id: 'upload' })
                                const path = await uploadLogo(f)
                                setStoreInfo({ ...storeInfo, logo: path })
                                toast.success('Đã tải logo lên', { id: 'upload' })
                            } catch (err) {
                                toast.error(err.message || 'Tải ảnh thất bại', { id: 'upload' })
                            }
                        }}
                        hidden
                    />
                </label>

                {/* Name */}
                <p className="mt-4 font-medium">Tên Cửa hàng *</p>
                <input
                    name="name"
                    onChange={onChangeHandler}
                    value={storeInfo.name}
                    type="text"
                    placeholder="Nhập tên cửa hàng"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                    required
                />

                {/* Description */}
                <p className="mt-4 font-medium">Mô tả *</p>
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={storeInfo.description}
                    rows={5}
                    placeholder="Nhập mô tả cửa hàng"
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
                    placeholder="Nhập email cửa hàng"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                    required
                />

                {/* Contact */}
                <p className="mt-4 font-medium">Số điện thoại *</p>
                <input
                    name="contact"
                    onChange={onChangeHandler}
                    value={storeInfo.contact}
                    type="text"
                    placeholder="Nhập số điện thoại liên hệ"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                    required
                />

                {/* Address */}
                <p className="mt-4 font-medium">Địa chỉ *</p>
                <textarea
                    name="address"
                    onChange={onChangeHandler}
                    value={storeInfo.address}
                    rows={5}
                    placeholder="Nhập địa chỉ cửa hàng"
                    className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
                    required
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    className="bg-slate-800 text-white px-12 py-2 rounded mt-6 mb-20 active:scale-95 hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || !storeInfo.name || !storeInfo.description || !storeInfo.email || !storeInfo.contact || !storeInfo.address || !storeInfo.logo}
                >
                    {submitting ? 'Đang cập nhật...' : 'Cập nhật Cài đặt'}
                </button>
            </form>
        </div>
    )
}

