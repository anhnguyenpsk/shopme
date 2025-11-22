import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { calculateAndValidateVoucherDiscount } from '@/lib/vouchers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { amount, addressId, items, userVoucherIds } = await request.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400 })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items provided' }), { status: 400 })
    }

    // --- Server-side validation ---
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, quantity: true, isActive: true, storeId: true, price: true }
    })

    if (products.length !== items.length) {
      return new Response(JSON.stringify({ error: 'Some products not found' }), { status: 400 })
    }

    const productMap = new Map(products.map(p => [p.id, p]))
    let serverSideSubtotal = 0;

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
      // Use server-side price for calculation
      serverSideSubtotal += product.price * item.quantity;
    }

    const storeIds = [...new Set(products.map(p => p.storeId))]
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, isActive: true }
    })

    const inactiveStore = stores.find(s => !s.isActive)
    if (inactiveStore) {
      return new Response(JSON.stringify({ 
        error: `The store "${inactiveStore.name}" is temporarily closed and not accepting orders` 
      }), { status: 400 })
    }

    // --- Voucher Validation ---
    const { totalDiscount } = await calculateAndValidateVoucherDiscount({
        userVoucherIds,
        cartItems: items,
        userId: session.user.id,
    });

    const serverSidePayableTotal = Math.round(serverSideSubtotal - totalDiscount);

    // CRITICAL: Security check to prevent tampering
    if (serverSidePayableTotal !== Math.round(amount)) {
        return new Response(JSON.stringify({ error: 'Price mismatch. Please refresh and try again.' }), { status: 400 });
    }
    
    // --- Stripe ---
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }), { status: 500 })
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: serverSidePayableTotal, // Use the validated server-side total
      currency: 'vnd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session.user.id,
        addressId: addressId || '',
        items: JSON.stringify(items || []),
        userVoucherIds: JSON.stringify(userVoucherIds || []), // New metadata
        total: String(serverSidePayableTotal),
      }
    })

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), { status: 200 })
  } catch (err) {
    console.error('Stripe PI error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to create payment intent' }), { status: 500 })
  }
}

