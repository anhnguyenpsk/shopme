import Stripe from 'stripe'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  if (!webhookSecret) {
    return new Response('Missing STRIPE_WEBHOOK_SECRET', { status: 500 })
  }

  let event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' })
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed.', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const metadata = pi.metadata || {}
        const userId = metadata.userId || ''
        const addressId = metadata.addressId || ''
        const total = Number(metadata.total || 0)

        let items = []
        try { items = JSON.parse(metadata.items || '[]') } catch {}
        let coupon = null
        try { coupon = JSON.parse(metadata.coupon || 'null') } catch {}

        if (!userId || !addressId || !Array.isArray(items) || items.length === 0 || !total) {
          // Missing data; acknowledge to avoid retries, but log it
          console.warn('Webhook missing required metadata to build order', { userId, addressId, itemsLength: items?.length, total })
          break
        }

        // Idempotency: skip if we already created an order for this PaymentIntent
        const existing = await prisma.order.findFirst({ where: { paymentIntentId: pi.id } })
        if (existing) break

        // Validate products, derive storeId, and check stock availability
        const productIds = items.map(i => i.productId)
        const products = await prisma.product.findMany({ 
          where: { id: { in: productIds } }, 
          select: { id: true, name: true, storeId: true, quantity: true, isActive: true } 
        })
        
        if (products.length !== items.length) {
          console.warn('Some products not found for webhook order creation')
          break
        }
        
        const firstStoreId = products[0].storeId
        const differentStore = products.some(p => p.storeId !== firstStoreId)
        if (differentStore) {
          console.warn('Items from different stores; refusing webhook order creation')
          break
        }

        // Fetch store to check status
        const store = await prisma.store.findUnique({
          where: { id: firstStoreId },
          select: { id: true, name: true, isActive: true }
        })

        if (store && !store.isActive) {
          // Log warning but STILL process order (payment was already made when store was active)
          console.warn(`Processing webhook order for inactive store: ${store.name}. Payment intent was created before deactivation.`, { paymentIntentId: pi.id })
        }

        // Check stock availability
        const productMap = new Map(products.map(p => [p.id, p]))
        let insufficientStock = false
        for (const item of items) {
          const product = productMap.get(item.productId)
          if (!product || !product.isActive || product.quantity < item.quantity) {
            console.warn(`Insufficient stock or inactive product for webhook order: ${product?.name || item.productId}`, {
              available: product?.quantity,
              requested: item.quantity,
              isActive: product?.isActive
            })
            insufficientStock = true
            break
          }
        }

        if (insufficientStock) {
          // Stock validation failed; we cannot create the order
          // In a production system, you might want to initiate a refund here
          console.error('Order cannot be created due to insufficient stock. Payment received but order not created.', { paymentIntentId: pi.id })
          break
        }

        // Use transaction to deduct quantities and create order atomically
        await prisma.$transaction(async (tx) => {
          // Deduct quantities from each product
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } }
            })
          }

          // Create the order
          await tx.order.create({
            data: {
              paymentIntentId: pi.id,
              total,
              userId,
              storeId: firstStoreId,
              addressId,
              isPaid: true,
              paymentMethod: 'STRIPE',
              isCouponUsed: !!coupon,
              coupon: coupon ? coupon : {},
              orderItems: {
                create: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price }))
              }
            }
          })
        })
        break
      }
      case 'payment_intent.payment_failed': {
        // Optionally log or mark something; for now, just acknowledge.
        break
      }
      default:
        // Ignore other events
        break
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Stripe webhook handler error', err)
    return new Response('Webhook error', { status: 500 })
  }
}

