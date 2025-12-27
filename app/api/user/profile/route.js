import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch current user profile data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user profile (name, phone, gender, dateOfBirth, image)
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, gender, dateOfBirth, image } = body;

    // Validate phone format if provided
    if (phone && phone.trim()) {
      const phoneRegex = /^(\+84|0)(3|5|7|8|9)([0-9]{8})$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
      }
    }

    // Build update data
    const updateData = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2 || name.trim().length > 50) {
        return NextResponse.json({ error: 'Name must be between 2 and 50 characters' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }

    if (gender !== undefined) {
      updateData.gender = gender || null;
    }

    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (image !== undefined) {
      updateData.image = image || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PATCH /api/user/profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

