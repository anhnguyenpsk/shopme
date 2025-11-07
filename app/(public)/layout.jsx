'use client'
// import Banner from "@/components/Banner";
import TopBar from "@/components/TopBar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
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
