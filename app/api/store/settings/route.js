import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import authSeller from "@/lib/authSeller";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/store/settings - Fetch store settings
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const storeId = await authSeller(userId);

    const storeInfo = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        logo: true,
        description: true,
        username: true,
        address: true,
        email: true,
        contact: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!storeInfo) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store: storeInfo });
  } catch (error) {
    const message = error?.message || "Failed to load store settings";
    const status = message === "Unauthorized" ? 401 : 500;
    console.error("STORE_SETTINGS_GET_ERROR", error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PATCH /api/store/settings - Update store settings
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const storeId = await authSeller(userId);

    const body = await request.json();
    const { name, description, email, contact, address, logo, isActive } = body;

    // Prepare data to update - only allow specific fields
    const dataToUpdate = {};

    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (email !== undefined) dataToUpdate.email = email;
    if (contact !== undefined) dataToUpdate.contact = contact;
    if (address !== undefined) dataToUpdate.address = address;
    if (logo !== undefined) dataToUpdate.logo = logo;
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive;

    // Update timestamp
    dataToUpdate.updatedAt = new Date();

    // Validate that at least one field is being updated
    if (Object.keys(dataToUpdate).length === 1) { // only updatedAt
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        logo: true,
        description: true,
        username: true,
        address: true,
        email: true,
        contact: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Store settings updated successfully",
      store: updatedStore
    });
  } catch (error) {
    const message = error?.message || "Failed to update store settings";
    const status = message === "Unauthorized" ? 401 : 500;
    console.error("STORE_SETTINGS_PATCH_ERROR", error);
    return NextResponse.json({ error: message }, { status });
  }
}




