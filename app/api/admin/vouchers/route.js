import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminSession, isHttpError } from "@/lib/auth/guards";

export const ADMIN_VOUCHER_TYPES = new Set(["PLATFORM", "SHIPPING"]);

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

function normalizeVoucherType(type) {
  if (!type) return null;
  const normalized = type.toUpperCase();
  return ADMIN_VOUCHER_TYPES.has(normalized) ? normalized : null;
}

function normalizeStatus(status) {
  return status ? status.toUpperCase() : undefined;
}

export function includeConfig() {
  return {
    applicableProducts: {
      select: { id: true, name: true, storeId: true },
    },
    applicableCategories: {
      select: { id: true, name: true },
    },
    _count: {
      select: { userVouchers: true },
    },
  };
}

export async function GET(request) {
  try {
    await requireAdminSession();

    const { searchParams } = new URL(request.url);
    const page = parseIntParam(searchParams.get("page"), 1);
    const limit = parseIntParam(searchParams.get("limit"), 20);
    const search = searchParams.get("search") || "";
    const typeFilter = normalizeVoucherType(searchParams.get("type"));
    const statusFilter = normalizeStatus(searchParams.get("status"));

    const where = {
      created_by_shop_id: null,
    };

    if (typeFilter) {
      where.voucher_type = typeFilter;
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    const searchFilter = buildSearchFilter(search);
    if (searchFilter) {
      where.AND = where.AND || [];
      where.AND.push(searchFilter);
    }

    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      prisma.voucherCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: includeConfig(),
      }),
      prisma.voucherCampaign.count({ where }),
    ]);

    return NextResponse.json({
      data: campaigns,
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

    console.error("GET /api/admin/vouchers error", error);
    return NextResponse.json(
      { error: "Failed to fetch voucher campaigns" },
      { status: 500 }
    );
  }
}

export function parseVoucherPayload(body) {
  if (!body) {
    throw new Error("Request body is required");
  }

  const {
    name,
    description,
    voucher_code: voucherCode,
    voucher_type: voucherType,
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

  if (!voucherType || !ADMIN_VOUCHER_TYPES.has(voucherType.toUpperCase())) {
    throw new Error("Admin vouchers must be PLATFORM or SHIPPING type");
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
    voucher_type: voucherType.toUpperCase(),
    discount_type: discountType,
    discount_value: parsedDiscountValue,
    max_discount_amount: parsedMaxDiscount,
    min_order_value: parsedMinOrder,
    start_date: parsedStartDate,
    end_date: parsedEndDate,
    total_usage_limit: parsedTotalUsage,
    user_usage_limit: parsedUserUsage,
    status: status ? status.toUpperCase() : "ACTIVE",
    created_by_shop_id: null,
    applicableProductIds: productIds,
    applicableCategoryIds: categoryIds,
  };
}

export async function POST(request) {
  try {
    await requireAdminSession();

    const body = await request.json();
    const payload = parseVoucherPayload(body);

    const data = { ...payload };
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
      include: includeConfig(),
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

    console.error("POST /api/admin/vouchers error", error);
    return NextResponse.json(
      { error: error.message || "Failed to create voucher campaign" },
      { status: 400 }
    );
  }
}


