import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }
    const { id } = await params
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

    const body = await request.json()
    const { name, street, city, state, country, phone } = body || {}

    if (!name || !street || !city || !state || !country || !phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 })
    }

    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

    const updated = await prisma.address.update({
      where: { id },
      data: { name, street, city, state, country, phone },
    })

    return new Response(JSON.stringify(updated), { status: 200 })
  } catch (err) {
    console.error('PATCH /api/addresses/[id] error', err)
    return new Response(JSON.stringify({ error: 'Failed to update address' }), { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }
    const { id } = await params
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

    await prisma.address.delete({ where: { id } })
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('DELETE /api/addresses/[id] error', err)
    return new Response(JSON.stringify({ error: 'Failed to delete address' }), { status: 500 })
  }
}

