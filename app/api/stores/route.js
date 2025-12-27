import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// API to get all approved stores
export async function GET(request) {
    try {
        const stores = await prisma.store.findMany({
            where: {
                status: "approved",
                isActive: true
            },
            select: {
                id: true,
                name: true,
                username: true,
                description: true,
                logo: true,
                _count: {
                    select: {
                        Product: {
                            where: {
                                isActive: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json({ stores });

    } catch (error) {
        console.error("Get stores error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
