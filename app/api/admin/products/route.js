import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET - Fetch all products from all stores with pagination and filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const storeId = searchParams.get('storeId') || '';
    const search = searchParams.get('search') || '';
    const inStock = searchParams.get('inStock');
    const categoryId = searchParams.get('categoryId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    
    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (inStock !== null && inStock !== undefined && inStock !== '') {
      whereClause.isActive = inStock === 'true';
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    // Fetch products and total count in parallel
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          store: {
            select: {
              id: true,
              name: true,
              username: true,
              logo: true
            }
          },
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          brandRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          rating: {
            select: {
              rating: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.product.count({ where: whereClause })
    ]);

    // Calculate average rating for each product
    const productsWithRating = products.map(product => {
      const ratings = product.rating || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      
      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingCount: ratings.length,
        rating: undefined // Remove the raw rating array
      };
    });

    // Get product statistics
    const [totalProducts, inactiveCount] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: false } })
    ]);

    const stats = {
      total: totalProducts,
      outOfStock: inactiveCount,
      inStock: totalProducts - inactiveCount
    };

    return NextResponse.json({
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

