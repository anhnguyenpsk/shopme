import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  const { productId } = await params;

  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            username: true,
            logo: true,
            isActive: true,
            status: true,
          }
        },
        rating: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        brandRef: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}



export async function PATCH(request, { params }) {
  try {
    const { productId } = await params;
    const body = await request.json()
    const { name, description, mrp, price, images, category, categoryId, isActive } = body || {}

    const existing = await prisma.product.findUnique({ where: { id: productId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        mrp: typeof mrp === 'number' ? mrp : existing.mrp,
        price: typeof price === 'number' ? price : existing.price,
        images: Array.isArray(images) && images.length > 0 ? images : existing.images,
        category: category ?? existing.category,
        categoryId: categoryId ?? existing.categoryId,
        isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
      }
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/products/[productId] error', err)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
