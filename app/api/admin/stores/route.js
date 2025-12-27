import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
import { inngest, Events } from '@/lib/inngest';

export const dynamic = 'force-dynamic';

// GET - Fetch stores for admin review, with optional status filter
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const stores = await prisma.store.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update store status (approve/reject)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, status, rejectionReason } = body;

    if (!storeId || !status) {
      return NextResponse.json(
        { message: 'Store ID and status are required' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status. Must be PENDING, APPROVED, or REJECTED' },
        { status: 400 }
      );
    }

    // Get current store status
    const currentStore = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!currentStore) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    const previousStatus = currentStore.status;

    // Update store status
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // If store is approved, update user role to STORE_OWNER
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      await prisma.user.update({
        where: { id: updatedStore.userId },
        data: { role: 'STORE_OWNER' }
      });
    }

    // Trigger Inngest background job for notifications
    await inngest.send({
      name: Events.STORE_STATUS_UPDATED,
      data: {
        storeId,
        status,
        previousStatus,
        adminId: session.user.id,
        rejectionReason,
        storeName: updatedStore.name,
        userEmail: updatedStore.user.email,
      }
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error('Error updating store status:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
