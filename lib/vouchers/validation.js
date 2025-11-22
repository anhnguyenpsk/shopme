import prisma from "@/lib/prisma";

const INACTIVE_STATUSES = new Set([
  "INACTIVE",
  "DISABLED",
  "ENDED",
  "EXHAUSTED",
  "ARCHIVED",
]);

function normalizeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function eligibleCartLinesForCampaign(campaign, cartLines) {
  if (!Array.isArray(cartLines) || cartLines.length === 0) {
    return { lines: [], total: 0 };
  }

  let eligible = cartLines;

  if (campaign.voucher_type === "SHOP" && campaign.created_by_shop_id) {
    eligible = eligible.filter(
      (line) => line.storeId === campaign.created_by_shop_id
    );
  }

  const productIds =
    campaign.applicableProducts?.map((product) => product.id) ?? [];
  const categoryIds =
    campaign.applicableCategories?.map((category) => category.id) ?? [];
  const productSet = productIds.length ? new Set(productIds) : null;
  const categorySet = categoryIds.length ? new Set(categoryIds) : null;

  if (productSet || categorySet) {
    eligible = eligible.filter((line) => {
      const matchesProduct = productSet ? productSet.has(line.productId) : false;
      const matchesCategory = categorySet
        ? line.categoryId && categorySet.has(line.categoryId)
        : false;

      if (productSet && categorySet) {
        return matchesProduct || matchesCategory;
      }
      if (productSet) return matchesProduct;
      if (categorySet) return matchesCategory;
      return true;
    });
  }

  const total = eligible.reduce((sum, line) => sum + line.lineTotal, 0);
  return { lines: eligible, total };
}

function baseAmountForCampaign(campaign, eligibleTotal, shippingFee) {
  if (campaign.voucher_type === "SHIPPING") {
    return shippingFee > 0 ? shippingFee : 0;
  }
  return eligibleTotal;
}

function calculateDiscount(campaign, baseAmount) {
  if (baseAmount <= 0) return 0;

  if (campaign.discount_type === "FIXED_AMOUNT") {
    return roundCurrency(Math.min(campaign.discount_value, baseAmount));
  }

  if (campaign.discount_type === "PERCENTAGE") {
    const raw = (campaign.discount_value / 100) * baseAmount;
    const capped = campaign.max_discount_amount
      ? Math.min(raw, campaign.max_discount_amount)
      : raw;
    return roundCurrency(Math.min(capped, baseAmount));
  }

  return 0;
}

function failResult({ campaign, userVoucher, code, reason }) {
  return {
    isValid: false,
    code,
    reason,
    campaignId: campaign?.id ?? null,
    userVoucherId: userVoucher?.id ?? null,
    discountAmount: 0,
    eligibleAmount: 0,
    eligibleLines: [],
  };
}

export function evaluateVoucherAgainstCart({
  campaign,
  userVoucher,
  cartLines,
  shippingFee = 0,
  now = new Date(),
  usageSummary,
} = {}) {
  if (!campaign) {
    return failResult({
      code: "missing_campaign",
      reason: "Voucher campaign not provided",
    });
  }

  if (!Array.isArray(cartLines) || cartLines.length === 0) {
    return failResult({
      campaign,
      userVoucher,
      code: "empty_cart",
      reason: "Cart is empty",
    });
  }

  const sessionNow = normalizeDate(now) ?? new Date();
  const startDate = normalizeDate(campaign.start_date);
  const endDate = normalizeDate(campaign.end_date);

  if (INACTIVE_STATUSES.has((campaign.status || "").toUpperCase())) {
    return failResult({
      campaign,
      userVoucher,
      code: "inactive_campaign",
      reason: "Voucher campaign is not active",
    });
  }

  if (startDate && sessionNow < startDate) {
    return failResult({
      campaign,
      userVoucher,
      code: "not_started",
      reason: "Voucher campaign has not started yet",
    });
  }

  if (endDate && sessionNow > endDate) {
    return failResult({
      campaign,
      userVoucher,
      code: "expired",
      reason: "Voucher campaign has expired",
    });
  }

  if (usageSummary?.totalUsed != null) {
    if (campaign.total_usage_limit != null) {
      if (usageSummary.totalUsed >= campaign.total_usage_limit) {
        return failResult({
          campaign,
          userVoucher,
          code: "campaign_usage_exhausted",
          reason: "Voucher campaign usage limit reached",
        });
      }
    }
  }

  if (userVoucher) {
    if (userVoucher.status !== "AVAILABLE") {
      return failResult({
        campaign,
        userVoucher,
        code: "voucher_not_available",
        reason: "Voucher is not available",
      });
    }

    if (
      userVoucher.voucher_campaign_id &&
      userVoucher.voucher_campaign_id !== campaign.id
    ) {
      return failResult({
        campaign,
        userVoucher,
        code: "voucher_mismatch",
        reason: "Voucher does not belong to the provided campaign",
      });
    }

    if (usageSummary?.userUsed != null) {
      if (campaign.user_usage_limit != null) {
        if (usageSummary.userUsed >= campaign.user_usage_limit) {
          return failResult({
            campaign,
            userVoucher,
            code: "user_usage_exhausted",
            reason: "User has reached voucher usage limit",
          });
        }
      }
    }
  }

  const { lines: eligibleLines, total: eligibleTotal } =
    eligibleCartLinesForCampaign(campaign, cartLines);

  if (eligibleLines.length === 0) {
    return failResult({
      campaign,
      userVoucher,
      code: "no_matching_items",
      reason: "No cart items qualify for this voucher",
    });
  }

  const baseAmount = baseAmountForCampaign(campaign, eligibleTotal, shippingFee);

  if (campaign.min_order_value && eligibleTotal < campaign.min_order_value) {
    return failResult({
      campaign,
      userVoucher,
      code: "below_minimum_spend",
      reason: "Cart total does not meet voucher minimum spend",
    });
  }

  if (campaign.voucher_type === "SHIPPING" && baseAmount <= 0) {
    return failResult({
      campaign,
      userVoucher,
      code: "no_shipping_cost",
      reason: "No shipping fees to apply voucher",
    });
  }

  const discountAmount = calculateDiscount(campaign, baseAmount);

  if (discountAmount <= 0) {
    return failResult({
      campaign,
      userVoucher,
      code: "no_discount",
      reason: "Voucher does not provide a discount for this cart",
    });
  }

  return {
    isValid: true,
    campaignId: campaign.id,
    userVoucherId: userVoucher?.id ?? null,
    campaign,
    userVoucher,
    eligibleLines,
    eligibleAmount: roundCurrency(baseAmount),
    discountAmount,
    meta: {
      voucherType: campaign.voucher_type,
      discountType: campaign.discount_type,
      code: campaign.voucher_code ?? null,
    },
  };
}

export async function buildCartSnapshot(cartItems, { prismaClient = prisma } = {}) {
  if (!Array.isArray(cartItems)) {
    throw new Error("cartItems must be an array");
  }

  if (cartItems.length === 0) {
    return {
      lines: [],
      subtotal: 0,
      subtotalByStore: new Map(),
      invalidItems: [],
      productMap: new Map(),
    };
  }

  const productIds = [
    ...new Set(
      cartItems
        .map((item) => item?.productId)
        .filter((id) => typeof id === "string" && id.trim().length > 0)
    ),
  ];

  if (productIds.length === 0) {
    return {
      lines: [],
      subtotal: 0,
      subtotalByStore: new Map(),
      invalidItems: cartItems,
      productMap: new Map(),
    };
  }

  const products = await prismaClient.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      storeId: true,
      isActive: true,
      quantity: true,
      categoryId: true,
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  const lines = [];
  const invalidItems = [];
  const subtotalByStore = new Map();
  let subtotal = 0;

  for (const rawItem of cartItems) {
    const productId = rawItem?.productId;
    const requestedQty = Number(rawItem?.quantity ?? 0);

    if (!productId || !productMap.has(productId) || requestedQty <= 0) {
      invalidItems.push(rawItem);
      continue;
    }

    const product = productMap.get(productId);
    const quantity = Math.min(requestedQty, product.quantity ?? requestedQty);
    const unitPrice = product.price;
    const lineTotal = roundCurrency(unitPrice * quantity);

    subtotal += lineTotal;
    subtotalByStore.set(
      product.storeId,
      roundCurrency((subtotalByStore.get(product.storeId) ?? 0) + lineTotal)
    );

    lines.push({
      productId,
      storeId: product.storeId,
      quantity,
      requestedQuantity: requestedQty,
      unitPrice,
      requestedUnitPrice:
        rawItem?.price !== undefined ? Number(rawItem.price) : null,
      lineTotal,
      categoryId: product.categoryId,
      product,
    });
  }

  return {
    lines,
    subtotal: roundCurrency(subtotal),
    subtotalByStore,
    invalidItems,
    productMap,
  };
}

export function groupVoucherResultsByType(results) {
  const grouped = {
    SHOP: [],
    PLATFORM: [],
    SHIPPING: [],
  };

  for (const res of results) {
    if (!res?.campaign?.voucher_type) continue;
    const type = res.campaign.voucher_type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(res);
  }

  return grouped;
}

export { INACTIVE_STATUSES };




