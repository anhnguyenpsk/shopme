import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get best-selling products (for now, we'll use products with offers as they're likely popular)
    const bestSellingProducts = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        store: {
          select: {
            name: true,
            username: true,
          }
        }
      },
      orderBy: [
        { price: 'asc' }, // Products with better offers first
        { createdAt: 'desc' }
      ],
      take: 12
    });

    return NextResponse.json(bestSellingProducts);
  } catch (error) {
    console.error('Error fetching best-selling products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
