import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateVerificationCode, createVerificationToken } from '@/lib/verification';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new NextResponse('Email is required', { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new NextResponse('Invalid email format', { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return new NextResponse('Email already verified', { status: 400 });
    }

    // Generate verification code and JWT token
    const code = generateVerificationCode();
    const token = createVerificationToken(email, code);

    // Send verification email
    await sendVerificationEmail(email, code);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      token,
      email,
    });
  } catch (error) {
    console.error('SEND_VERIFICATION_ERROR:', error);
    
    // Handle email sending errors specifically
    if (error.message.includes('Failed to send verification email')) {
      return new NextResponse('Failed to send email. Please try again later.', { status: 500 });
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}













