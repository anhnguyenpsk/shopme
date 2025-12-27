import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const ordersToConfirm = await prisma.order.findMany({
            where: {
                status: 'DELIVERED',
                OR: [
                    { deliveredAt: { lte: tenDaysAgo } },
                    { deliveredAt: null, updatedAt: { lte: tenDaysAgo } }
                ]
            }
        });

        const updates = ordersToConfirm.map(order =>
            prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            })
        );

        const results = await Promise.all(updates);

        return NextResponse.json({
            message: `Auto-confirmed ${results.length} orders`,
            confirmedCount: results.length,
            confirmedOrderIds: results.map(o => o.id)
        });

    } catch (error) {
        console.error('Error in auto-confirm cron:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
