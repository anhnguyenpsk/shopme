import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// API to create a store for a user
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();

        const name = formData.get('name');
        const username = formData.get('username');
        const description = formData.get('description');
        const email = formData.get('email');
        const contact = formData.get('contact');
        const address = formData.get('address');
        // Expect a string path returned by /api/upload-store, e.g. "/uploads/store/avatar/.."
        const image = formData.get('image');

        // Check for missing information
        if (!name || !username || !description || !email || !contact || !address || !image) {
            return NextResponse.json({ error: "Missing store information" }, { status: 400 });
        }
        if (typeof image !== 'string') {
            return NextResponse.json({ error: "Invalid image value; expected uploaded path string" }, { status: 400 });
        }

        // Check if store already exists for this user
        const existingStore = await prisma.store.findFirst({
            where: {
                userId: session.user.id
            }
        });

        if (existingStore) {
            return NextResponse.json({ status: existingStore.status });
        }

        // Check if username is taken
        const isUsernameTaken = await prisma.store.findFirst({
            where: {
                username: username.toLowerCase()
            }
        });

        if (isUsernameTaken) {
            return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
        }

        // Create store with already-uploaded local avatar path
        const newStore = await prisma.store.create({
            data: {
                userId: session.user.id,
                name,
                description,
                username: username.toLowerCase(),
                email,
                contact,
                address,
                logo: image, // e.g. "/uploads/store/avatar/xxxx.jpg"
                status: "pending" // Default status is pending approval
            }
        });

        // Update user role to STORE_OWNER
        await prisma.user.update({
            where: {
                id: session.user.id
            },
            data: {
                role: "STORE_OWNER"
            }
        });

        return NextResponse.json({ message: "Store application submitted successfully! Waiting for admin approval." });

    } catch (error) {
        console.error("Store creation error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

// Check if user has already registered a store and return status
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const store = await prisma.store.findFirst({
            where: {
                userId: session.user.id
            }
        });

        if (store) {
            return NextResponse.json({ status: store.status });
        }

        return NextResponse.json({ status: "not registered" });

    } catch (error) {
        console.error("Store status check error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
