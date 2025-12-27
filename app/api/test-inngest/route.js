import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { inngest, Events } from '@/lib/inngest';

export const dynamic = 'force-dynamic';

// POST - Test Inngest background jobs
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobType, data } = body;

    let eventName;
    let eventData;

    switch (jobType) {
      case 'store-approval':
        eventName = Events.STORE_STATUS_UPDATED;
        eventData = {
          storeId: data.storeId || 'test-store-id',
          status: data.status || 'APPROVED',
          previousStatus: data.previousStatus || 'PENDING',
          adminId: session.user.id,
          storeName: data.storeName || 'Test Store',
          userEmail: data.userEmail || 'test@example.com',
        };
        break;

      case 'user-registration':
        eventName = Events.USER_REGISTERED;
        eventData = {
          userId: data.userId || 'test-user-id',
          email: data.email || 'newuser@example.com',
          name: data.name || 'Test User',
        };
        break;

      case 'order-created':
        eventName = Events.ORDER_CREATED;
        eventData = {
          orderId: data.orderId || 'test-order-id',
          userId: data.userId || 'test-user-id',
          storeId: data.storeId || 'test-store-id',
          total: data.total || 99.99,
        };
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid job type. Use: store-approval, user-registration, or order-created' },
          { status: 400 }
        );
    }

    // Send the event to Inngest
    const result = await inngest.send({
      name: eventName,
      data: eventData,
    });

    return NextResponse.json({
      message: 'Background job triggered successfully',
      jobType,
      eventName,
      eventData,
      inngestResult: result,
    });
  } catch (error) {
    console.error('Error triggering Inngest job:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get information about available test jobs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Inngest test endpoint',
      availableJobs: [
        {
          type: 'store-approval',
          description: 'Test store approval notification',
          sampleData: {
            storeId: 'store-123',
            status: 'APPROVED',
            previousStatus: 'PENDING',
            storeName: 'My Test Store',
            userEmail: 'storeowner@example.com',
          }
        },
        {
          type: 'user-registration',
          description: 'Test user registration welcome',
          sampleData: {
            userId: 'user-123',
            email: 'newuser@example.com',
            name: 'John Doe',
          }
        },
        {
          type: 'order-created',
          description: 'Test order processing',
          sampleData: {
            orderId: 'order-123',
            userId: 'user-123',
            storeId: 'store-123',
            total: 149.99,
          }
        }
      ],
      usage: {
        method: 'POST',
        body: {
          jobType: 'store-approval',
          data: {
            // ... job-specific data
          }
        }
      }
    });
  } catch (error) {
    console.error('Error getting test job info:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
