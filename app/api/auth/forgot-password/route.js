import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security, do not reveal if user does not exist
            // But for better UX in this demo, maybe we can just return success or handled differently.
            // Standard practice: Return success 200 even if email not found to prevent enumeration.
            return NextResponse.json(
                { message: 'If an account exists, a reset link has been sent.' },
                { status: 200 }
            );
        }

        if (!user.hashedPassword) {
            return NextResponse.json(
                { error: 'User does not have a password set (likely a social login account).' },
                { status: 400 }
            );
        }

        // Create a one-time secret using the user's current password hash
        // This ensures that if the password changes, the token becomes invalid
        const secret = process.env.NEXTAUTH_SECRET + user.hashedPassword;

        // Create a JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            secret,
            { expiresIn: '15m' } // Token expires in 15 minutes
        );

        // Create reset link
        // Ensure NEXT_PUBLIC_APP_URL is set, otherwise fallback to localhost
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl}/reset-password?id=${user.id}&token=${token}`;

        // Send email
        await sendPasswordResetEmail(user.email, resetUrl);

        return NextResponse.json(
            { message: 'Password reset link sent' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
