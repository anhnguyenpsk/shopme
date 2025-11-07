import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Fetch all orders from all stores with pagination and filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status') || '';
    const storeId = searchParams.get('storeId') || '';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (status && ['ORDER_PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) {
      whereClause.status = status;
    }

    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Fetch orders and total count in parallel
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          store: {
            select: {
              id: true,
              name: true,
              username: true,
              logo: true
            }
          },
          address: true,
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where: whereClause })
    ]);

    // Calculate revenue statistics
    const revenueStats = await prisma.order.aggregate({
      where: whereClause,
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Get status breakdown
    const statusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: storeId ? { storeId } : {}
    });

    const stats = {
      totalRevenue: revenueStats._sum.total || 0,
      totalOrders: revenueStats._count.id || 0,
      byStatus: statusBreakdown.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {})
    };

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}






