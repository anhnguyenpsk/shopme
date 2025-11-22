import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSellerContext, isHttpError } from "@/lib/auth/guards";

const DEFAULT_PAGE_SIZE = 20;

function parseIntParam(value, defaultValue) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function buildSearchFilter(search) {
  if (!search) return undefined;
  return {
    OR: [
      { name: { contains: search, mode: "insensitive" } },
      { voucher_code: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ],
  };
}

export function storeVoucherIncludeConfig() {
  return {
    applicableProducts: {
      select: { id: true, name: true, storeId: true },
    },
    applicableCategories: {
      select: { id: true, name: true },
    },
    _count: {
      select: {
        userVouchers: true,
      },
    },
  };
}

function normalizeStatusFilter(value) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return ["ongoing", "upcoming", "expired", "all"].includes(normalized)
    ? normalized
    : null;
}

function buildStatusFilter(status) {
  if (!status || status === "all") return [];

  const now = new Date();
  if (status === "ongoing") {
    return [
      { start_date: { lte: now } },
      { end_date: { gte: now } },
      { status: { in: ["ACTIVE", "ONGOING"] } },
    ];
  }

  if (status === "upcoming") {
    return [{ start_date: { gt: now } }];
  }

  if (status === "expired") {
    return [
      {
        OR: [
          { end_date: { lt: now } },
          { status: { in: ["ENDED", "EXPIRED"] } },
        ],
      },
    ];
  }

  return [];
}

function parseNewShopVoucher(body) {
  if (!body) {
    throw new Error("Request body is required");
  }

  const {
    name,
    description,
    voucher_code: voucherCode,
    discount_type: discountType,
    discount_value: discountValue,
    max_discount_amount: maxDiscountAmount,
    min_order_value: minOrderValue,
    start_date: startDate,
    end_date: endDate,
    total_usage_limit: totalUsageLimit,
    user_usage_limit: userUsageLimit,
    status,
    applicableProductIds,
    applicableCategoryIds,
  } = body;

  if (!name || !name.trim()) {
    throw new Error("Voucher name is required");
  }

  if (!discountType || !["FIXED_AMOUNT", "PERCENTAGE"].includes(discountType)) {
    throw new Error("Invalid discount type");
  }

  const parsedDiscountValue = Number(discountValue);
  if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue <= 0) {
    throw new Error("Discount value must be greater than 0");
  }

  const parsedTotalUsage = Number(totalUsageLimit);
  if (!Number.isFinite(parsedTotalUsage) || parsedTotalUsage <= 0) {
    throw new Error("Total usage limit must be greater than 0");
  }

  const parsedUserUsage =
    userUsageLimit !== undefined && userUsageLimit !== null
      ? Number(userUsageLimit)
      : 1;

  if (!Number.isFinite(parsedUserUsage) || parsedUserUsage <= 0) {
    throw new Error("User usage limit must be greater than 0");
  }

  const parsedMaxDiscount =
    maxDiscountAmount === undefined || maxDiscountAmount === null
      ? null
      : Number(maxDiscountAmount);

  if (
    parsedMaxDiscount !== null &&
    (!Number.isFinite(parsedMaxDiscount) || parsedMaxDiscount < 0)
  ) {
    throw new Error("Max discount amount must be a positive number");
  }

  const parsedMinOrder =
    minOrderValue === undefined || minOrderValue === null
      ? 0
      : Number(minOrderValue);

  if (!Number.isFinite(parsedMinOrder) || parsedMinOrder < 0) {
    throw new Error("Minimum order value must be zero or greater");
  }

  const parsedStartDate = startDate ? new Date(startDate) : null;
  const parsedEndDate = endDate ? new Date(endDate) : null;

  if (!parsedStartDate || Number.isNaN(parsedStartDate.getTime())) {
    throw new Error("A valid start date is required");
  }

  if (!parsedEndDate || Number.isNaN(parsedEndDate.getTime())) {
    throw new Error("A valid end date is required");
  }

  if (parsedEndDate <= parsedStartDate) {
    throw new Error("End date must be later than start date");
  }

  const productIds = Array.isArray(applicableProductIds)
    ? [...new Set(applicableProductIds.filter(Boolean))]
    : [];

  const categoryIds = Array.isArray(applicableCategoryIds)
    ? [...new Set(applicableCategoryIds.filter(Boolean))]
    : [];

  return {
    name: name.trim(),
    description: description?.trim() || null,
    voucher_code: voucherCode?.trim() || null,
    voucher_type: "SHOP",
    discount_type: discountType,
    discount_value: parsedDiscountValue,
    max_discount_amount: parsedMaxDiscount,
    min_order_value: parsedMinOrder,
    start_date: parsedStartDate,
    end_date: parsedEndDate,
    total_usage_limit: parsedTotalUsage,
    user_usage_limit: parsedUserUsage,
    status: status ? status.toUpperCase() : "ACTIVE",
    applicableProductIds: productIds,
    applicableCategoryIds: categoryIds,
  };
}

export async function ensureProductsBelongToStore(productIds, storeId) {
  if (!productIds?.length) return;

  const count = await prisma.product.count({
    where: { id: { in: productIds }, storeId },
  });

  if (count !== productIds.length) {
    throw new Error("One or more products do not belong to your store");
  }
}

export async function GET(request) {
  try {
    const { storeId } = await requireSellerContext();
    const { searchParams } = new URL(request.url);
    const page = parseIntParam(searchParams.get("page"), 1);
    const limit = parseIntParam(searchParams.get("limit"), DEFAULT_PAGE_SIZE);
    const search = searchParams.get("search") || "";
    const statusFilter = normalizeStatusFilter(searchParams.get("status"));
    
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where = {
      created_by_shop_id: storeId,
      voucher_type: "SHOP",
    };

    const searchFilter = buildSearchFilter(search);
    if (searchFilter) {
      where.AND = where.AND || [];
      where.AND.push(searchFilter);
    }

    const statusConditions = buildStatusFilter(statusFilter);
    if (statusConditions.length) {
      where.AND = where.AND || [];
      where.AND.push(...statusConditions);
    }

    const skip = (page - 1) * limit;

    // Allowed sort fields
    const allowedSortFields = ['start_date', 'end_date', 'status', 'createdAt'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [campaigns, total] = await prisma.$transaction([
      prisma.voucherCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: storeVoucherIncludeConfig(),
      }),
      prisma.voucherCampaign.count({ where }),
    ]);

    if (campaigns.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total, totalPages: 0 },
      });
    }

    const campaignIds = campaigns.map(c => c.id);

    const usedCounts = await prisma.userVoucher.groupBy({
      by: ['voucher_campaign_id'],
      where: {
        voucher_campaign_id: { in: campaignIds },
        status: 'USED',
      },
      _count: { _all: true },
    });

    const usedMap = new Map(usedCounts.map(u => [u.voucher_campaign_id, u._count._all]));

    const dataWithCounts = campaigns.map(campaign => ({
      ...campaign,
      usedCount: usedMap.get(campaign.id) || 0,
      collectedCount: campaign._count.userVouchers,
    }));


    return NextResponse.json({
      data: dataWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/store/vouchers error", error);
    return NextResponse.json(
      { error: "Failed to fetch store vouchers" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { storeId } = await requireSellerContext();
    const body = await request.json();
    const payload = parseNewShopVoucher(body);

    await ensureProductsBelongToStore(payload.applicableProductIds, storeId);

    const data = {
      ...payload,
      created_by_shop_id: storeId,
    };

    delete data.applicableProductIds;
    delete data.applicableCategoryIds;

    if (payload.applicableProductIds.length) {
      data.applicableProducts = {
        connect: payload.applicableProductIds.map((id) => ({ id })),
      };
    }

    if (payload.applicableCategoryIds.length) {
      data.applicableCategories = {
        connect: payload.applicableCategoryIds.map((id) => ({ id })),
      };
    }

    const voucher = await prisma.voucherCampaign.create({
      data,
      include: storeVoucherIncludeConfig(),
    });

    return NextResponse.json({ voucher }, { status: 201 });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Voucher code already exists" },
        { status: 400 }
      );
    }

    console.error("POST /api/store/vouchers error", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voucher" },
      { status: 400 }
    );
  }
}


