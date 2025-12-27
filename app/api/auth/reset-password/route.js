import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        const { id, token, password } = await req.json();

        if (!id || !token || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Reconstruct the secret used to sign the token
        const secret = process.env.NEXTAUTH_SECRET + user.hashedPassword;

        try {
            // Verify the token
            jwt.verify(token, secret);
        } catch (error) {
            console.log(error);
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password
        await prisma.user.update({
            where: { id: user.id },
            data: { hashedPassword },
        });

        return NextResponse.json(
            { message: 'Password reset successful' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Something went wrong' },
            { status: 500 }
        );
    }
}
