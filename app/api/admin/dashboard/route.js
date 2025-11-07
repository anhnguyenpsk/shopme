import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/admin/dashboard - aggregate metrics for admin dashboard
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all statistics in parallel for better performance
    const [
      totalProducts,
      totalOrders,
      totalStores,
      allOrders,
      approvedStores
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.store.count(),
      prisma.order.findMany({
        select: {
          createdAt: true,
          total: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.store.count({
        where: {
          status: 'approved'
        }
      })
    ]);

    // Calculate total revenue
    const totalRevenue = Math.round(
      allOrders.reduce((acc, order) => acc + (Number(order.total) || 0), 0)
    );

    return NextResponse.json({
      products: totalProducts,
      orders: totalOrders,
      stores: approvedStores,
      revenue: totalRevenue,
      allOrders: allOrders
    });
  } catch (error) {
    console.error('ADMIN_DASHBOARD_ERROR', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}

