import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateVerificationCode, createVerificationToken } from '@/lib/verification';
import { sendVerificationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, gender, dateOfBirth } = body;

    if (!name || !email || !password) {
      return new NextResponse('Missing name, email, or password', { status: 400 });
    }

    // Validate phone format if provided
    if (phone && phone.trim()) {
      const phoneRegex = /^(\+84|0)(3|5|7|8|9)([0-9]{8})$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ''))) {
        return new NextResponse('Invalid phone number format', { status: 400 });
      }
    }

    const exist = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (exist) {
      return new NextResponse('User already exists', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      hashedPassword,
      role: 'CUSTOMER',
    };

    // Add optional fields if provided
    if (phone && phone.trim()) {
      userData.phone = phone.trim();
    }
    if (gender) {
      userData.gender = gender;
    }
    if (dateOfBirth) {
      userData.dateOfBirth = new Date(dateOfBirth);
    }

    const user = await prisma.user.create({
      data: userData,
    });

    // Generate verification code and token
    const code = generateVerificationCode();
    const token = createVerificationToken(email, code);

    // Send verification email
    try {
      await sendVerificationEmail(email, code);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue registration even if email fails
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    console.error('REGISTRATION_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

