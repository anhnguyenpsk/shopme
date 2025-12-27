import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// API to get store data and products by username
export async function GET(request, { params }) {
    try {
        const { username } = await params;

        if (!username) {
            return NextResponse.json({ error: "Username is required" }, { status: 400 });
        }

        const store = await prisma.store.findFirst({
            where: {
                username: username.toLowerCase(),
                status: "approved", // Only show approved stores
            },
            select: {
                id: true,
                name: true,
                username: true,
                logo: true,
                description: true,
                isActive: true,
                status: true,
                Product: {
                    where: {
                        isActive: true // Only show active products
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        images: true,
                        price: true,
                        quantity: true,
                        isActive: true,
                        categoryId: true,
                        brandId: true,
                        storeId: true,
                    }
                }
            }
        });

        if (!store) {
            return NextResponse.json({ error: "Store not found or not approved" }, { status: 404 });
        }

        const { Product, ...storeInfo } = store;

        // If store is inactive, return store info but no products
        if (!storeInfo.isActive) {
            return NextResponse.json({ 
                storeInfo, 
                products: [],
                message: "This store is temporarily closed"
            });
        }

        // Add store info to each product so the product detail page can check store status
        const productsWithStore = Product.map(product => ({
            ...product,
            store: {
                id: storeInfo.id,
                name: storeInfo.name,
                username: storeInfo.username,
                isActive: storeInfo.isActive,
                status: storeInfo.status,
            }
        }));

        return NextResponse.json({ storeInfo, products: productsWithStore });

    } catch (error) {
        console.error("Get store error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

