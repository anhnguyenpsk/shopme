import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

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
        const { name, description, price, quantity, categoryId, brandId, images, hasVariations, variationGroups, variants } = body;

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
                hasVariations,
                variationGroups,
                variants: {
                    deleteMany: {
                        id: {
                            notIn: variants?.filter(v => v.id).map(v => v.id) || []
                        }
                    },
                    upsert: variants?.filter(v => v.id).map(v => ({
                        where: { id: v.id },
                        update: {
                            price: Number(v.price),
                            quantity: Number(v.quantity),
                            sku: v.sku,
                            attributes: v.attributes,
                            images: v.images || []
                        },
                        create: {
                            price: Number(v.price),
                            quantity: Number(v.quantity),
                            sku: v.sku,
                            attributes: v.attributes,
                            images: v.images || []
                        }
                    })) || [],
                    create: variants?.filter(v => !v.id).map(v => ({
                        price: Number(v.price),
                        quantity: Number(v.quantity),
                        sku: v.sku,
                        attributes: v.attributes,
                        images: v.images || []
                    })) || []
                }
            },
        });

        return NextResponse.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

