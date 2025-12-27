import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await params;
    const { status, isActive } = await request.json();

    const dataToUpdate = {};

    if (status) {
        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        dataToUpdate.status = status;
        if (status === 'approved') {
            dataToUpdate.isActive = true;
        }
    }

    if (typeof isActive === 'boolean') {
        dataToUpdate.isActive = isActive;
    }

    try {
        const updatedStore = await prisma.store.update({
            where: { id: storeId },
            data: dataToUpdate,
        });

        // Upgrade user role if approved
        if (dataToUpdate.status === 'approved') {
            await prisma.user.update({
                where: { id: updatedStore.userId },
                data: { role: 'STORE_OWNER' }
            });
        }
        // Downgrade user role if rejected or suspended
        else if (dataToUpdate.status === 'rejected' || dataToUpdate.isActive === false) {
            await prisma.user.update({
                where: { id: updatedStore.userId },
                data: { role: 'CUSTOMER' }
            });
        }

        return NextResponse.json(updatedStore);
    } catch (error) {
        console.error(`Error updating store ${storeId}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

