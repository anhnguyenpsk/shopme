import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import authSeller from '@/lib/authSeller'

export const dynamic = 'force-dynamic';

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
        },
        rating: {
          select: {
            rating: true
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
    const {
      name,
      description,
      price,
      categoryId,
      brandId,
      images,
      quantity,
      hasVariations,
      variationGroups,
      variants
    } = body || {}

    if (!name || !description || price === undefined || !categoryId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // Validation for Variations
    if (hasVariations) {
      if (!Array.isArray(variationGroups) || variationGroups.length === 0) {
        return new Response(JSON.stringify({ error: 'Variation groups are required for variable products' }), { status: 400 })
      }
      if (variationGroups.length > 2) {
        return new Response(JSON.stringify({ error: 'Maximum 2 variation groups allowed' }), { status: 400 })
      }

      // Calculate total combinations limit from groups
      // Assuming variationGroups structure: [{ name: 'Color', options: ['Red', 'Blue'] }, ...]
      let totalCombinations = 1;
      for (const group of variationGroups) {
        if (Array.isArray(group.options)) {
          if (group.options.length > 50) {
            return new Response(JSON.stringify({ error: `Maximum 50 choices allowed per group (${group.name})` }), { status: 400 })
          }
          totalCombinations *= group.options.length;
        }
      }

      if (totalCombinations > 100) {
        return new Response(JSON.stringify({ error: 'Total variation combinations cannot exceed 100' }), { status: 400 })
      }
    }

    const qty = typeof quantity === 'number' ? Math.max(0, Math.floor(quantity)) : 0

    // Prepare create data
    const createData = {
      name,
      description,
      price: Number(price),
      categoryId: categoryId,
      brandId: brandId || null,
      images: Array.isArray(images) ? images : [],
      quantity: qty, // Main product quantity (sum of variants if variable? User provided?)
      storeId,
      isActive: qty > 0,
      hasVariations: !!hasVariations,
      variationGroups: hasVariations ? variationGroups : null,
    }

    // Create Product and Variants transactionally
    // If hasVariations, handle variants creation
    if (hasVariations && Array.isArray(variants) && variants.length > 0) {
      // Enforce variants limit just in case
      if (variants.length > 100) {
        return new Response(JSON.stringify({ error: 'Too many variants' }), { status: 400 })
      }

      createData.variants = {
        create: variants.map(v => ({
          attributes: v.attributes, // { "Color": "Red" }
          price: Number(v.price),
          quantity: Number(v.quantity),
          sku: v.sku,
          images: Array.isArray(v.images) ? v.images : []
        }))
      }

      // Optimistically calculate total quantity from variants
      const totalVariantQty = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
      createData.quantity = totalVariantQty
      createData.isActive = totalVariantQty > 0
    }

    const created = await prisma.product.create({
      data: createData,
      include: {
        variants: true // Return variants in response
      }
    })

    return new Response(JSON.stringify(created), { status: 201 })
  } catch (err) {
    console.error('POST /api/products error', err)
    return new Response(JSON.stringify({ error: 'Failed to create product' }), { status: 500 })
  }
}
