import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateVerificationCode } from '@/lib/verification';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, code, token } = body;

    if (!email || !code || !token) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Validate the verification code against the JWT token
    const validation = validateVerificationCode(token, code, email);

    if (!validation.valid) {
      return new NextResponse(validation.message, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Update user's emailVerified field
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email: user.email,
    });
  } catch (error) {
    console.error('VERIFY_EMAIL_ERROR:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}













