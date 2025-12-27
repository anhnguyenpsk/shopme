'use client'
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import StoreNavbar from "./StoreNavbar"
import StoreSidebar from "./StoreSidebar"
import Loading from "@/components/shared/Loading"
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner"

const StoreLayout = ({ children }) => {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [storeInfo, setStoreInfo] = useState(null)

    useEffect(() => {
        if (status === "loading") return

        if (!session) {
            router.push("/login")
            return
        }

        if (session.user.role !== "STORE_OWNER" && session.user.role !== "ADMIN") {
            router.push("/")
            return
        }

        // Fetch actual store info from API
        const fetchStoreInfo = async () => {
            try {
                const response = await fetch('/api/store/dashboard')
                const data = await response.json()
                if (data.storeInfo) {
                    setStoreInfo(data.storeInfo)
                }
            } catch (error) {
                console.error('Failed to fetch store info:', error)
            }
        }

        fetchStoreInfo()
    }, [session, status, router])

    if (status === "loading" || !session || (session.user.role !== "STORE_OWNER" && session.user.role !== "ADMIN")) {
        return <Loading />;
    }

    return (
        <div className="flex flex-col h-screen">
            <EmailVerificationBanner />
            <StoreNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <StoreSidebar storeInfo={storeInfo} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default StoreLayout