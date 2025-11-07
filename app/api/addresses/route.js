import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return new Response(JSON.stringify(addresses), { status: 200 })
  } catch (err) {
    console.error("GET /api/addresses error", err)
    return new Response(JSON.stringify({ error: "Failed to fetch addresses" }), { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const body = await request.json()
    const { name, street, city, state, country, phone } = body || {}

    if (!name || !street || !city || !state || !country || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
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

    return new Response(JSON.stringify(created), { status: 201 })
  } catch (err) {
    console.error("POST /api/addresses error", err)
    return new Response(JSON.stringify({ error: "Failed to create address" }), { status: 500 })
  }
}

