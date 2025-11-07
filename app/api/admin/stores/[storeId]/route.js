import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

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

        return NextResponse.json(updatedStore);
    } catch (error) {
        console.error(`Error updating store ${storeId}:`, error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

