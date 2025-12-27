import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ["ACTIVE", "ONGOING"];

function buildApplicabilityConditions({ productId, categoryId }) {
  const conditions = [
    {
      AND: [
        { applicableProducts: { none: {} } },
        { applicableCategories: { none: {} } },
      ],
    },
  ];

  if (productId) {
    conditions.push({ applicableProducts: { some: { id: productId } } });
  }

  if (categoryId) {
    conditions.push({ applicableCategories: { some: { id: categoryId } } });
  }

  return conditions;
}

function mapVoucherForResponse(voucher) {
  const now = new Date();
  const state =
    voucher.start_date > now
      ? "upcoming"
      : voucher.end_date < now
      ? "expired"
      : "ongoing";

  const slotsRemaining =
    voucher.total_usage_limit - (voucher._count?.userVouchers ?? 0);

  return {
    ...voucher,
    state,
    slotsRemaining: Math.max(0, slotsRemaining),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get("storeId");
    const productIdParam = searchParams.get("productId");
    const search = searchParams.get("search") || "";
    const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50;

    if (storeIdParam && productIdParam) {
      return NextResponse.json(
        { error: "Provide either storeId or productId, not both" },
        { status: 400 }
      );
    }

    let product = null;
    let storeId = storeIdParam || null;
    let categoryId = null;

    if (productIdParam) {
      product = await prisma.product.findUnique({
        where: { id: productIdParam },
        select: { id: true, storeId: true, categoryId: true },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      storeId = product.storeId;
      categoryId = product.categoryId;
    }

    if (!storeId && !productIdParam) {
      return NextResponse.json(
        { error: "storeId or productId is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const where = {
      end_date: { gte: now },
      status: { in: ACTIVE_STATUSES },
    };

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { voucher_code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const applicabilityConditions = buildApplicabilityConditions({
      productId: product?.id || null,
      categoryId,
    });

    const orFilters = [];

    if (storeId && !product) {
      orFilters.push({
        voucher_type: "SHOP",
        created_by_shop_id: storeId,
      });
    }

    if (product) {
      orFilters.push({
        voucher_type: "SHOP",
        created_by_shop_id: storeId,
        OR: applicabilityConditions,
      });
    }

    orFilters.push({
      voucher_type: "PLATFORM",
      OR: applicabilityConditions,
    });

    orFilters.push({
      voucher_type: "SHIPPING",
    });

    where.AND = where.AND || [];
    where.AND.push({ OR: orFilters });

    const vouchers = await prisma.voucherCampaign.findMany({
      where,
      take: safeLimit,
      orderBy: [
        { voucher_type: "asc" },
        { start_date: "asc" },
      ],
      include: {
        applicableProducts: { select: { id: true, name: true, storeId: true } },
        applicableCategories: { select: { id: true, name: true } },
        store: { select: { id: true, name: true, username: true } },
        _count: { select: { userVouchers: true } },
      },
    });

    const filtered = vouchers
      .filter((voucher) => voucher.total_usage_limit > (voucher._count?.userVouchers ?? 0))
      .map(mapVoucherForResponse);

    return NextResponse.json({ vouchers: filtered });
  } catch (error) {
    console.error("GET /api/vouchers/public error", error);
    return NextResponse.json(
      { error: "Failed to load public vouchers" },
      { status: 500 }
    );
  }
}


