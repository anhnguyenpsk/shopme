import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log("GET /api/addresses session:", session?.user?.email, session?.user?.id)
    if (!session?.user?.id) {
      console.log("GET /api/addresses Unauthorized: No session or user id")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(addresses)
  } catch (err) {
    console.error("GET /api/addresses error", err)
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, street, city, state, country, phone } = body || {}

    if (!name || !street || !city || !state || !country || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const created = await prisma.address.create({
      data: {
        userId: session.user.id,
        name,
        street,
        city,
        state,
        country,
        phone,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error("POST /api/addresses error", err)
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 })
  }
}

