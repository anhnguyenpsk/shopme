import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        address: true,
        store: {
          select: { id: true, name: true, logo: true, username: true }
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, images: true, storeId: true }
            }
          }
        }
      }
    })

    return new Response(JSON.stringify(orders), { status: 200 })
  } catch (err) {
    console.error("GET /api/orders error", err)
    return new Response(JSON.stringify({ error: "Failed to fetch orders" }), { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const body = await request.json()
    const { items, addressId, total, paymentMethod, isPaid = false, coupon = null, paymentIntentId = null } = body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items" }), { status: 400 })
    }
    if (!addressId) {
      return new Response(JSON.stringify({ error: "Missing addressId" }), { status: 400 })
    }
    if (!total || total <= 0) {
      return new Response(JSON.stringify({ error: "Invalid total" }), { status: 400 })
    }
    if (!paymentMethod || !["COD", "STRIPE"].includes(paymentMethod)) {
      return new Response(JSON.stringify({ error: "Invalid payment method" }), { status: 400 })
    }

    // Fetch all products
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({ 
      where: { id: { in: productIds } }, 
      select: { id: true, name: true, storeId: true, quantity: true, isActive: true } 
    })

    if (products.length !== items.length) {
      return new Response(JSON.stringify({ error: "Some products not found" }), { status: 400 })
    }

    // Group items by store
    const productMap = new Map(products.map(p => [p.id, p]))
    const storeGroups = new Map()
    
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) continue
      
      const storeId = product.storeId
      if (!storeGroups.has(storeId)) {
        storeGroups.set(storeId, [])
      }
      storeGroups.get(storeId).push({ ...item, product })
    }

    // Fetch stores for validation
    const storeIds = [...new Set(products.map(p => p.storeId))]
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, isActive: true }
    })

    // Check if any store is inactive
    const storeMap = new Map(stores.map(s => [s.id, s]))
    for (const [storeId, storeItems] of storeGroups) {
      const store = storeMap.get(storeId)
      if (!store || !store.isActive) {
        return new Response(JSON.stringify({ 
          error: `The store "${store?.name || 'Unknown'}" is temporarily closed and not accepting orders` 
        }), { status: 400 })
      }
    }

    // Check stock availability and product active status (all-or-nothing)
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.productId}` }), { status: 400 })
      }
      if (!product.isActive) {
        return new Response(JSON.stringify({ error: `Product "${product.name}" is currently unavailable` }), { status: 400 })
      }
      if (product.quantity < item.quantity) {
        return new Response(JSON.stringify({ 
          error: `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}` 
        }), { status: 400 })
      }
    }

    // Check for duplicate order with same paymentIntentId (Stripe idempotency)
    if (paymentIntentId) {
      const existingOrders = await prisma.order.findMany({ 
        where: { paymentIntentId },
        include: {
          address: true,
          store: {
            select: { id: true, name: true, logo: true, username: true }
          },
          orderItems: {
            include: { product: { select: { id: true, name: true, images: true, storeId: true } } }
          }
        }
      })
      if (existingOrders.length > 0) {
        // Orders already exist, return them instead of creating duplicates
        return new Response(JSON.stringify(existingOrders), { status: 200 })
      }
    }

    // Use transaction to deduct quantities and create orders atomically (one per store)
    const createdOrders = await prisma.$transaction(async (tx) => {
      // Deduct quantities from each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } }
        })
      }

      // Create one order per store
      const orders = []
      for (const [storeId, storeItems] of storeGroups) {
        // Calculate total for this store
        const storeTotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        
        // Determine if coupon applies to this store (coupon applies to specific store only)
        let storeCoupon = {}
        let storeIsCouponUsed = false
        if (coupon && coupon.storeId === storeId) {
          storeCoupon = coupon
          storeIsCouponUsed = true
        }
        
        // Create the order for this store
        const order = await tx.order.create({
          data: {
            total: storeTotal,
            userId: session.user.id,
            storeId,
            addressId,
            isPaid: !!isPaid,
            paymentMethod,
            paymentIntentId: paymentIntentId || undefined,
            isCouponUsed: storeIsCouponUsed,
            coupon: storeCoupon,
            orderItems: {
              create: storeItems.map(i => ({ 
                productId: i.productId, 
                quantity: i.quantity, 
                price: i.price 
              }))
            }
          },
          include: {
            address: true,
            store: {
              select: { id: true, name: true, logo: true, username: true }
            },
            orderItems: {
              include: { product: { select: { id: true, name: true, images: true, storeId: true } } }
            }
          }
        })
        
        orders.push(order)
      }

      return orders
    })

    return new Response(JSON.stringify(createdOrders), { status: 201 })
  } catch (err) {
    console.error("POST /api/orders error", err)
    return new Response(JSON.stringify({ error: "Failed to create order" }), { status: 500 })
  }
}

