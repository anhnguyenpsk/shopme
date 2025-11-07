import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - Fetch all orders for the logged-in store owner
export async function GET(request) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'STORE_OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const store = await prisma.store.findUnique({
            where: { userId: session.user.id },
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const orders = await prisma.order.findMany({
            where: { storeId: store.id },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: { name: true, images: true },
                        },
                    },
                },
                address: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update an order's status and/or payment status
export async function PATCH(request) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'STORE_OWNER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { orderId, status, isPaid } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // At least one field must be provided
        if (!status && typeof isPaid !== 'boolean') {
            return NextResponse.json({ error: 'At least one field (status or isPaid) must be provided' }, { status: 400 });
        }

        const store = await prisma.store.findUnique({
            where: { userId: session.user.id },
        });

        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Verify the order belongs to the store before updating
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                storeId: store.id,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found or you do not have permission to edit it' }, { status: 404 });
        }

        // Build update data object conditionally
        const updateData = {};
        if (status) updateData.status = status;
        if (typeof isPaid === 'boolean') updateData.isPaid = isPaid;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

