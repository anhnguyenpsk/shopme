import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch single product details
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            username: true,
            logo: true,
            email: true,
            contact: true
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        orderItems: {
          select: {
            orderId: true,
            quantity: true,
            price: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Calculate statistics
    const avgRating = product.rating.length > 0
      ? product.rating.reduce((sum, r) => sum + r.rating, 0) / product.rating.length
      : 0;

    const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      product: {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingCount: product.rating.length,
        totalSold
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (for policy violations)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            name: true
          }
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: {
        id: existingProduct.id,
        name: existingProduct.name,
        storeName: existingProduct.store.name
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update product visibility/status (optional feature)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const body = await request.json();
    const { isActive } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isActive: Boolean(isActive) },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

