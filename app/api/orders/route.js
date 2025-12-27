import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import prisma from "@/lib/prisma"
import { calculateAndValidateVoucherDiscount } from "@/lib/vouchers"

export const dynamic = 'force-dynamic';

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
    const { items, addressId, total, paymentMethod, isPaid = false, userVoucherIds = [], paymentIntentId = null } = body || {}

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items" }), { status: 400 })
    }
    if (!addressId) {
      return new Response(JSON.stringify({ error: "Missing addressId" }), { status: 400 })
    }
    if (!total || total < 0) { // total can be 0 for free items with vouchers
      return new Response(JSON.stringify({ error: "Invalid total" }), { status: 400 })
    }
    if (!paymentMethod || !["COD", "STRIPE"].includes(paymentMethod)) {
      return new Response(JSON.stringify({ error: "Invalid payment method" }), { status: 400 })
    }

    // --- Server-side validation and calculation ---
    const productIds = items.map(i => i.productId)
    const variantIds = items.map(i => i.variantId).filter(id => Boolean(id) && typeof id === 'string')

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, storeId: true, quantity: true, isActive: true, price: true }
    })

    const variants = variantIds.length > 0
      ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true, price: true, quantity: true, attributes: true }
      })
      : []

    if (products.length !== new Set(productIds).size) {
      // Note: products.length matching set size is approximate check, rigorous check is looking up each.
      // Proceeding with lookup check in loop is safer.
    }

    const productMap = new Map(products.map(p => [p.id, p]))
    const variantMap = new Map(variants.map(v => [v.id, v]))
    const storeGroups = new Map()
    let grandSubtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return new Response(JSON.stringify({ error: `Product not found: ${item.productId}` }), { status: 400 })
      }
      if (!product.isActive) {
        return new Response(JSON.stringify({ error: `Product "${product.name}" is currently unavailable` }), { status: 400 })
      }

      let price = product.price
      let quantityAvailable = product.quantity
      let variant = null;

      if (item.variantId) {
        variant = variantMap.get(item.variantId)
        if (!variant) {
          return new Response(JSON.stringify({ error: `Variant not found for product "${product.name}"` }), { status: 400 })
        }
        if (variant.productId !== item.productId) {
          return new Response(JSON.stringify({ error: `Invalid variant for product "${product.name}"` }), { status: 400 })
        }
        price = variant.price
        quantityAvailable = variant.quantity
      }

      if (quantityAvailable < item.quantity) {
        const itemDesc = variant ? `${product.name} (Variant)` : product.name
        return new Response(JSON.stringify({
          error: `Insufficient stock for "${itemDesc}". Available: ${quantityAvailable}, Requested: ${item.quantity}`
        }), { status: 400 })
      }

      const storeId = product.storeId
      if (!storeGroups.has(storeId)) {
        storeGroups.set(storeId, { items: [], subtotal: 0 })
      }
      const storeGroup = storeGroups.get(storeId)
      const lineTotal = price * item.quantity // Use validated price
      storeGroup.items.push({ ...item, product, price, variant }) // Store validated price/variant
      storeGroup.subtotal += lineTotal
      grandSubtotal += lineTotal
    }

    const storeIds = Array.from(storeGroups.keys())
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
    const { totalDiscount, validationResults } = await calculateAndValidateVoucherDiscount({
      userVoucherIds,
      cartItems: items,
      userId: session.user.id,
    });

    const serverSidePayableTotal = Math.round(grandSubtotal - totalDiscount);

    // CRITICAL: Security check
    if (serverSidePayableTotal !== Math.round(total)) {
      // Detailed error for debugging usually, but generic for user
      console.error(`Price mismatch: Server ${serverSidePayableTotal} vs Client ${total}`)
      return new Response(JSON.stringify({ error: 'Price mismatch. Please refresh and try again.' }), { status: 400 });
    }

    // --- Idempotency Check ---
    if (paymentIntentId) {
      const existingOrders = await prisma.order.findMany({
        where: { paymentIntentId },
        include: {
          address: true,
          store: { select: { id: true, name: true, logo: true, username: true } },
          orderItems: { include: { product: { select: { id: true, name: true, images: true, storeId: true } } } }
        }
      })
      if (existingOrders.length > 0) {
        return new Response(JSON.stringify(existingOrders), { status: 200 })
      }
    }

    // --- Transaction ---
    const createdOrders = await prisma.$transaction(async (tx) => {
      // 1. Deduct quantities
      for (const item of items) {
        if (item.variantId) {
          // Deduct variant stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { quantity: { decrement: item.quantity } }
          })
          // Deduct parent stock to keep aggregate sync
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } }
          })
        } else {
          // Simple product stock deduction
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } }
          })
        }
      }

      // 2. Separate voucher discounts by type
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
        // Distribute discounts
        let storeDiscountAmount = 0;
        // Apply shop-specific voucher discount
        if (shopVoucherDiscounts.has(storeId)) {
          storeDiscountAmount += shopVoucherDiscounts.get(storeId);
        }
        // Apply proportional platform & shipping discounts
        const storeProportion = grandSubtotal > 0 ? group.subtotal / grandSubtotal : 0;
        storeDiscountAmount += (platformDiscount + shippingDiscount) * storeProportion;

        const order = await tx.order.create({
          data: {
            total: group.subtotal,
            totalDiscountAmount: Math.round(storeDiscountAmount),
            userId: session.user.id,
            storeId,
            addressId,
            isPaid: !!isPaid,
            paymentMethod,
            paymentIntentId: paymentIntentId || undefined,
            orderItems: {
              create: group.items.map(i => ({
                productId: i.productId,
                variantId: i.variantId || null,
                quantity: i.quantity,
                price: i.price // Use the validated price collected in loop above
              }))
            }
          },
          include: {
            address: true,
            store: { select: { id: true, name: true, logo: true, username: true } },
            orderItems: { include: { product: { select: { id: true, name: true, images: true, storeId: true } } } }
          }
        })
        orders.push(order)
      }

      // 4. Update voucher status and link to the FIRST order
      if (userVoucherIds.length > 0 && orders.length > 0) {
        await tx.userVoucher.updateMany({
          where: { id: { in: userVoucherIds }, user_id: session.user.id },
          data: {
            status: 'USED',
            used_in_order_id: orders[0].id, // Link all to the first order
            used_date: new Date()
          }
        });
      }

      return orders
    })

    return new Response(JSON.stringify(createdOrders), { status: 201 })
  } catch (err) {
    console.error("POST /api/orders error", err)
    return new Response(JSON.stringify({ error: err.message || "Failed to create order" }), { status: 500 })
  }
}

