import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

// GET - Fetch a single product for editing
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'STORE_OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { productId } = await params;

        const store = await prisma.store.findUnique({
            where: { userId: session.user.id },
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                storeId: store.id, // Ensure the product belongs to the seller's store
            },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update a product's details
export async function PATCH(request, { params }) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'STORE_OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { productId } = await params;
        const body = await request.json();
        const { name, description, price, quantity, categoryId, brandId, images } = body;

        const store = await prisma.store.findUnique({
            where: { userId: session.user.id },
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify the product belongs to the store before updating
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                storeId: store.id,
            },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found or you do not have permission to edit it' }, { status: 404 });
        }

        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                description,
                price: Number(price),
                quantity: Number(quantity),
                categoryId,
                brandId: brandId || null,
                images,
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

