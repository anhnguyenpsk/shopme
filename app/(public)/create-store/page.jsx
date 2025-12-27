'use client'
import { assets } from "@/assets/assets"
import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/shared/Loading"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import axios from "axios"

export default function CreateStore() {

    const { data: session } = useSession()
    const router = useRouter()

    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [status, setStatus] = useState("")
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState("")

    const [storeInfo, setStoreInfo] = useState({
        name: "",
        username: "",
        description: "",
        email: "",
        contact: "",
        address: "",
        image: ""
    })

    const onChangeHandler = (e) => {
        setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
    }

    const uploadAvatar = async (file) => {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload-store', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Upload failed')
        return data.path // relative path
    }


    const fetchSellerStatus = async () => {
        if (!session?.user?.id) {
            setLoading(false)
            return
        }

        try {
            const { data } = await axios.get('/api/store/create')
            if (data.status !== "not registered") {
                setAlreadySubmitted(true)
                setStatus(data.status)

                if (data.status === "pending") {
                    setMessage("Đơn đăng ký cửa hàng của bạn đang được xem xét. Chúng tôi sẽ thông báo cho bạn sau khi được chấp thuận.")
                } else if (data.status === "approved") {
                    setMessage("Cửa hàng của bạn đã được chấp thuận! Đang chuyển hướng đến bảng điều khiển...")
                    setTimeout(() => {
                        router.push('/store')
                    }, 5000)
                } else if (data.status === "rejected") {
                    setMessage("Đơn đăng ký cửa hàng của bạn đã bị từ chối. Vui lòng liên hệ bộ phận hỗ trợ để biết thêm thông tin.")
                }
            }
        } catch (error) {
            console.error("Error fetching seller status:", error)
        }

        setLoading(false)
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        if (!session?.user?.id) {
            return toast.error("Bạn phải đăng nhập để tạo cửa hàng")
        }

        // Validate required fields
        if (!storeInfo.name || !storeInfo.username || !storeInfo.description ||
            !storeInfo.email || !storeInfo.contact || !storeInfo.address || !storeInfo.image) {
            return toast.error("Vui lòng điền đầy đủ các trường bắt buộc")
        }

        try {
            const formData = new FormData()
            formData.append('name', storeInfo.name)
            formData.append('description', storeInfo.description)
            formData.append('username', storeInfo.username.toLowerCase())
            formData.append('email', storeInfo.email)
            formData.append('contact', storeInfo.contact)
            formData.append('address', storeInfo.address)
            formData.append('image', storeInfo.image)

            const { data } = await axios.post('/api/store/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            toast.success(data.message)
            setAlreadySubmitted(true)
            setStatus("pending")
            setMessage("Đơn đăng ký cửa hàng của bạn đã được gửi thành công! Chúng tôi sẽ xem xét và thông báo cho bạn sau khi được chấp thuận.")

        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        fetchSellerStatus()
    }, [session])

    if (!session) {
        return (
            <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
                <h1 className="text-2xl sm:text-4xl font-semibold">
                    Vui lòng <span className="text-slate-500">Đăng nhập</span> để tiếp tục
                </h1>
            </div>
        )
    }

    return !loading ? (
        <>
            {!alreadySubmitted ? (
                <div className="mx-6 min-h-[70vh] my-16">
                    <form onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Đang gửi dữ liệu..." })} className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500">
                        {/* Title */}
                        <div>
                            <h1 className="text-3xl ">Tạo <span className="text-slate-800 font-medium">Cửa hàng</span> của bạn</h1>
                            <p className="max-w-lg">Để trở thành người bán trên ShopMe, hãy gửi thông tin cửa hàng của bạn để xét duyệt. Cửa hàng của bạn sẽ được kích hoạt sau khi admin xác minh.</p>
                        </div>

                        <label className="mt-10 cursor-pointer">
                            Logo Cửa hàng
                            <Image src={storeInfo.image ? storeInfo.image : assets.upload_area} className="rounded-lg mt-2 h-16 w-auto" alt="" width={150} height={100} />
                            <input type="file" accept="image/*" onChange={async (e) => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                try {
                                    const path = await uploadAvatar(f)
                                    setStoreInfo({ ...storeInfo, image: path })
                                    toast.success('Đã tải lên Logo')
                                } catch (err) {
                                    toast.error(err.message || 'Tải lên thất bại')
                                }
                            }} hidden />
                        </label>

                        <p>Tên đăng nhập (Username) *</p>
                        <input
                            name="username"
                            onChange={onChangeHandler}
                            value={storeInfo.username}
                            type="text"
                            placeholder="Nhập tên đăng nhập cửa hàng"
                            className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                            required
                        />

                        <p>Tên cửa hàng *</p>
                        <input
                            name="name"
                            onChange={onChangeHandler}
                            value={storeInfo.name}
                            type="text"
                            placeholder="Nhập tên cửa hàng của bạn"
                            className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                            required
                        />

                        <p>Mô tả *</p>
                        <textarea
                            name="description"
                            onChange={onChangeHandler}
                            value={storeInfo.description}
                            rows={5}
                            placeholder="Nhập mô tả cửa hàng"
                            className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
                            required
                        />

                        <p>Email *</p>
                        <input
                            name="email"
                            onChange={onChangeHandler}
                            value={storeInfo.email}
                            type="email"
                            placeholder="Nhập email cửa hàng"
                            className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                            required
                        />

                        <p>Số điện thoại liên hệ *</p>
                        <input
                            name="contact"
                            onChange={onChangeHandler}
                            value={storeInfo.contact}
                            type="text"
                            placeholder="Nhập số điện thoại liên hệ"
                            className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
                            required
                        />

                        <p>Địa chỉ *</p>
                        <textarea
                            name="address"
                            onChange={onChangeHandler}
                            value={storeInfo.address}
                            rows={5}
                            placeholder="Nhập địa chỉ cửa hàng"
                            className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
                            required
                        />

                        <button
                            type="submit"
                            className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!storeInfo.name || !storeInfo.username || !storeInfo.description || !storeInfo.email || !storeInfo.contact || !storeInfo.address || !storeInfo.image}
                        >
                            Gửi đăng ký
                        </button>
                    </form>
                </div>
            ) : (
                <div className="min-h-[80vh] flex flex-col items-center justify-center">
                    <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">{message}</p>
                    {status === "approved" && <p className="mt-5 text-slate-400">chuyển hướng đến bảng điều khiển trong <span className="font-semibold">5 giây</span></p>}
                </div>
            )}
        </>
    ) : (<Loading />)
}