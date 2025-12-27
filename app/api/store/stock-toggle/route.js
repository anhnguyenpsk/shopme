import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import authSeller from "@/lib/authSeller";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// POST /api/store/stock-toggle - toggle isActive for a product owned by the seller
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const storeId = await authSeller(userId);

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
      select: { id: true, isActive: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.update({
      where: { id: productId },
      data: { isActive: !product.isActive },
    });

    return NextResponse.json({ message: "Stock status updated", isActive: !product.isActive });
  } catch (error) {
    const message = error?.message || "Failed to toggle stock";
    const status = message === "Unauthorized" ? 401 : 500;
    console.error("STOCK_TOGGLE_ERROR", error);
    return NextResponse.json({ error: message }, { status });
  }
}

