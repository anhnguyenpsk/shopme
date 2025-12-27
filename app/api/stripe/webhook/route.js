import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { calculateAndValidateVoucherDiscount } from '@/lib/vouchers'

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
        
        let items = []
        try { items = JSON.parse(metadata.items || '[]') } catch {}
        
        let userVoucherIds = []
        try { userVoucherIds = JSON.parse(metadata.userVoucherIds || '[]') } catch {}

        if (!userId || !addressId || !Array.isArray(items) || items.length === 0) {
          console.warn('Webhook missing required metadata to build order', { userId, addressId, itemsLength: items?.length })
          break
        }

        // Idempotency: check if orders for this PaymentIntent already exist
        const existing = await prisma.order.findFirst({ where: { paymentIntentId: pi.id } })
        if (existing) break

        // --- Replicate logic from /api/orders ---
        const productIds = items.map(i => i.productId)
        const products = await prisma.product.findMany({ 
          where: { id: { in: productIds } }, 
          select: { id: true, name: true, storeId: true, quantity: true, isActive: true, price: true } 
        })
        
        if (products.length !== items.length) {
          console.error(`Webhook Error (PI: ${pi.id}): Product mismatch. DB found ${products.length}, metadata had ${items.length}.`)
          break
        }
        
        const productMap = new Map(products.map(p => [p.id, p]))
        const storeGroups = new Map()
        let grandSubtotal = 0;
        
        for (const item of items) {
          const product = productMap.get(item.productId)
          if (!product || !product.isActive || product.quantity < item.quantity) {
            console.error(`Webhook Error (PI: ${pi.id}): Product ${product?.name || item.productId} is invalid or has insufficient stock. Order not created.`)
            // In production, this should trigger a refund.
            return new Response('ok', { status: 200 }) // Acknowledge webhook to prevent retries
          }
          
          const storeId = product.storeId
          if (!storeGroups.has(storeId)) {
            storeGroups.set(storeId, { items: [], subtotal: 0 })
          }
          const storeGroup = storeGroups.get(storeId)
          const lineTotal = product.price * item.quantity
          storeGroup.items.push({ ...item, product })
          storeGroup.subtotal += lineTotal
          grandSubtotal += lineTotal
        }

        // --- Voucher Validation ---
        const { totalDiscount, validationResults } = await calculateAndValidateVoucherDiscount({
            userVoucherIds,
            cartItems: items,
            userId: userId,
        });

        // --- Transaction ---
        await prisma.$transaction(async (tx) => {
          // 1. Deduct quantities
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } }
            })
          }

          // 2. Separate voucher discounts
          const shopVoucherDiscounts = new Map();
          let platformDiscount = 0;
          let shippingDiscount = 0;

          validationResults.forEach(result => {
            const { campaign, discountAmount } = result;
            if (campaign.voucher_type === 'SHOP') {
                shopVoucherDiscounts.set(campaign.created_by_shop_id, discountAmount);
            } else if (campaign.voucher_type === 'PLATFORM') {
                platformDiscount += discountAmount;
            } else if (campaign.voucher_type === 'SHIPPING') {
                shippingDiscount += discountAmount;
            }
          });

          // 3. Create one order per store
          const orders = []
          for (const [storeId, group] of storeGroups) {
            let storeDiscountAmount = 0;
            if (shopVoucherDiscounts.has(storeId)) {
                storeDiscountAmount += shopVoucherDiscounts.get(storeId);
            }
            const storeProportion = grandSubtotal > 0 ? group.subtotal / grandSubtotal : 0;
            storeDiscountAmount += (platformDiscount + shippingDiscount) * storeProportion;

            const order = await tx.order.create({
              data: {
                total: group.subtotal,
                totalDiscountAmount: Math.round(storeDiscountAmount),
                userId: userId,
                storeId,
                addressId,
                isPaid: true,
                paymentMethod: 'STRIPE',
                paymentIntentId: pi.id,
                orderItems: {
                  create: group.items.map(i => ({ 
                    productId: i.productId, 
                    quantity: i.quantity, 
                    price: i.product.price 
                  }))
                }
              }
            })
            orders.push(order)
          }

          // 4. Update voucher status
          if (userVoucherIds.length > 0 && orders.length > 0) {
              await tx.userVoucher.updateMany({
                  where: { id: { in: userVoucherIds }, user_id: userId },
                  data: {
                      status: 'USED',
                      used_in_order_id: orders[0].id,
                      used_date: new Date()
                  }
              });
          }
        })
        break
      }
      case 'payment_intent.payment_failed': {
        break
      }
      default:
        break
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Stripe webhook handler error', err)
    return new Response('Webhook error', { status: 500 })
  }
}

