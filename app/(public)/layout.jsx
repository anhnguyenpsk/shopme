'use client'
// import Banner from "@/components/Banner";
import TopBar from "@/components/layout/TopBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchProducts } from '@/lib/features/product/productSlice'

export default function PublicLayout({ children }) {
    const dispatch = useDispatch()

    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch])

    return (
        <>
            {/* <Banner /> */}
            <EmailVerificationBanner />
            <TopBar />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
