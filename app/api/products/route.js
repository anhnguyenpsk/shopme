import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import authSeller from '@/lib/authSeller'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        store: {
          isActive: true,
          status: 'approved'
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        images: true,
        price: true,
        quantity: true,
        isActive: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            username: true,
            isActive: true,
            status: true,
          }
        }
      }
    })
    return new Response(JSON.stringify(products), { status: 200 })
  } catch (err) {
    console.error('GET /api/products error', err)
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    const storeId = await authSeller(session.user.id)

    const body = await request.json()
    const { name, description, price, categoryId, brandId, images, quantity } = body || {}

    if (!name || !description || price === undefined || !categoryId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const qty = typeof quantity === 'number' ? Math.max(0, Math.floor(quantity)) : 0

    const created = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        categoryId: categoryId,
        brandId: brandId || null,
        images: Array.isArray(images) ? images : [],
        quantity: qty,
        storeId,
        isActive: qty > 0,
      }
    })

    return new Response(JSON.stringify(created), { status: 201 })
  } catch (err) {
    console.error('POST /api/products error', err)
    return new Response(JSON.stringify({ error: 'Failed to create product' }), { status: 500 })
  }
}

