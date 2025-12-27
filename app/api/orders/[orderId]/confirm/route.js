import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    const { orderId } = params;

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (order.status !== 'DELIVERED') {
            return NextResponse.json({ error: 'Order must be delivered before it can be confirmed' }, { status: 400 });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error('Error confirming order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
