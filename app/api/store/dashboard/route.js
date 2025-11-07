import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import authSeller from "@/lib/authSeller";
import prisma from "@/lib/prisma";

// GET /api/store/dashboard - aggregate metrics for the seller's store
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const storeId = await authSeller(userId);

    // Placeholder aggregation with simple queries; replace with real reporting as needed
    const [ordersCount, productsCount, orders, storeInfo] = await Promise.all([
      prisma.order.count({ where: { storeId } }),
      prisma.product.count({ where: { storeId } }),
      prisma.order.findMany({ where: { storeId }, select: { total: true } }),
      prisma.store.findUnique({ 
        where: { id: storeId },
        select: {
          id: true,
          name: true,
          logo: true,
          description: true,
          username: true,
          address: true,
          email: true,
          contact: true,
          status: true,
          isActive: true,
        }
      }),
    ]);

    const totalEarnings = Math.round(
      orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0)
    );

    // Placeholder ratings: count ratings for products belonging to this store
    const ratings = await prisma.rating.findMany({
      where: { product: { storeId } },
      select: { rating: true },
      take: 10,
    });

    return NextResponse.json({
      dashboardData: {
        totalOrders: ordersCount,
        totalEarnings,
        totalProducts: productsCount,
        ratings,
      },
      storeInfo,
    });
  } catch (error) {
    const message = error?.message || "Failed to load dashboard";
    const status = message === "Unauthorized" ? 401 : 500;
    console.error("STORE_DASHBOARD_ERROR", error);
    return NextResponse.json({ error: message }, { status });
  }
}

