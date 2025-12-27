import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Create a new rating/review
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, review, productId, orderId } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Validate review
    if (!review || review.trim().length < 5) {
      return NextResponse.json({ error: 'Review must be at least 5 characters' }, { status: 400 });
    }

    if (!productId || !orderId) {
      return NextResponse.json({ error: 'Product ID and Order ID are required' }, { status: 400 });
    }

    // Verify the order exists, belongs to the user, is delivered, and contains the product
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
        status: { in: ['DELIVERED', 'COMPLETED'] }, // Allow rating for Delivered and Completed orders
        orderItems: {
          some: { productId }
        }
      },
      include: {
        orderItems: {
          where: { productId }
        }
      }
    });

    if (!order) {
      return NextResponse.json({
        error: 'Order not found, not delivered, or product not in order'
      }, { status: 404 });
    }

    // Check if user already rated this product for this order
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_productId_orderId: {
          userId: session.user.id,
          productId,
          orderId
        }
      }
    });

    if (existingRating) {
      return NextResponse.json({
        error: 'You have already rated this product for this order'
      }, { status: 400 });
    }

    // Create the rating
    const newRating = await prisma.rating.create({
      data: {
        rating,
        review: review.trim(),
        userId: session.user.id,
        productId,
        orderId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(newRating, { status: 201 });
  } catch (error) {
    console.error('POST /api/ratings error:', error);
    return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 });
  }
}

// GET - Fetch user's ratings (to check which products they've rated)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const where = { userId: session.user.id };
    if (orderId) {
      where.orderId = orderId;
    }

    const ratings = await prisma.rating.findMany({
      where,
      select: {
        id: true,
        productId: true,
        orderId: true,
        rating: true
      }
    });

    return NextResponse.json(ratings);
  } catch (error) {
    console.error('GET /api/ratings error:', error);
    return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
  }
}



