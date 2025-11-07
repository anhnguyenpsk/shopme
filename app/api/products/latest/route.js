import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const latestProducts = await prisma.product.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 8
    });

    const productsWithImage = latestProducts.map(product => ({
      ...product,
      image: product.images[0] || null
    }));

    return NextResponse.json(productsWithImage);
  } catch (error) {
    console.error('Error fetching latest products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
