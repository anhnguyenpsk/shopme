'use client'
import Link from "next/link"
import { ShoppingBagIcon, StoreIcon, PackageIcon, BarChart3Icon } from "lucide-react"
import Hero from "@/components/homepage/Hero"
import StatsSection from "@/components/homepage/StatsSection"
import LatestProducts from "@/components/homepage/LatestProducts"
import BestSelling from "@/components/homepage/BestSelling"
import CategoriesMarquee from "@/components/homepage/CategoriesMarquee"
import OurSpecs from "@/components/homepage/OurSpecs"
import Newsletter from "@/components/homepage/Newsletter"

export default function HomePage() {
    return (
        <div className="min-h-screen">
            <Hero />
            <StatsSection />
            <LatestProducts />
            <BestSelling />
            <CategoriesMarquee />
            <OurSpecs />
            <Newsletter />
        </div>
    )
}
