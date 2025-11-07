import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get featured products (products with high ratings or recent additions)
    const featuredProducts = await prisma.product.findMany({
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
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: 6
    });

    return NextResponse.json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
