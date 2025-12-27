import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSellerContext, isHttpError } from "@/lib/auth/guards";
import {
  ensureProductsBelongToStore,
  storeVoucherIncludeConfig,
} from "../route";

export const dynamic = 'force-dynamic';

function determineVoucherState(voucher) {
  const now = new Date();
  if (voucher.start_date > now) return "upcoming";
  if (voucher.end_date < now || ["ENDED", "EXPIRED"].includes(voucher.status)) {
    return "expired";
  }
  return "ongoing";
}

const allowedFieldsByState = {
  upcoming: new Set([
    "name",
    "description",
    "voucher_code",
    "discount_type",
    "discount_value",
    "max_discount_amount",
    "min_order_value",
    "start_date",
    "end_date",
    "total_usage_limit",
    "user_usage_limit",
    "status",
    "applicableProductIds",
    "applicableCategoryIds",
  ]),
  ongoing: new Set([
    "name",
    "description",
    "end_date",
    "min_order_value",
    "status",
  ]),
  expired: new Set(["status", "description"]),
};

function ensureFieldAllowed(state, field) {
  const allowed =
    allowedFieldsByState[state] || allowedFieldsByState["upcoming"];
  if (!allowed.has(field)) {
    throw new Error(`Cannot modify ${field} for a ${state} voucher`);
  }
}

function sanitizeIdArray(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error("Expected an array");
  }
  return [...new Set(value.filter(Boolean))];
}

async function ensureStoreVoucher(campaignId, storeId) {
  if (!campaignId || typeof campaignId !== "string") {
    throw new Error("campaignId is required");
  }

  const voucher = await prisma.voucherCampaign.findFirst({
    where: {
      id: campaignId,
      created_by_shop_id: storeId,
      voucher_type: "SHOP",
    },
    include: storeVoucherIncludeConfig(),
  });

  if (!voucher) {
    const error = new Error("Voucher not found");
    error.status = 404;
    throw error;
  }

  return voucher;
}

function parseUpdateShopVoucher(body, existing) {
  if (!body || typeof body !== "object") {
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

  const state = determineVoucherState(existing);
  const data = {};

  if (body.name !== undefined) {
    ensureFieldAllowed(state, "name");
    if (!body.name || !body.name.trim()) {
      throw new Error("Voucher name cannot be empty");
    }
    data.name = body.name.trim();
  }

  if (body.description !== undefined) {
    ensureFieldAllowed(state, "description");
    data.description = body.description?.trim() || null;
  }

  if (body.voucherCode !== undefined) {
    ensureFieldAllowed(state, "voucher_code");
    data.voucher_code = body.voucherCode?.trim() || null;
  }

  if (body.discountType !== undefined) {
    ensureFieldAllowed(state, "discount_type");
    if (!["FIXED_AMOUNT", "PERCENTAGE"].includes(body.discountType)) {
      throw new Error("Invalid discount type");
    }
    data.discount_type = body.discountType;
  }

  if (body.discountValue !== undefined) {
    ensureFieldAllowed(state, "discount_value");
    const value = Number(body.discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Discount value must be greater than 0");
    }
    data.discount_value = value;
  }

  if (body.maxDiscountAmount !== undefined) {
    ensureFieldAllowed(state, "max_discount_amount");
    const value =
      body.maxDiscountAmount === null
        ? null
        : Number(body.maxDiscountAmount);
    if (
      value !== null &&
      (!Number.isFinite(value) || value < 0)
    ) {
      throw new Error("Max discount amount must be a positive number");
    }
    data.max_discount_amount = value;
  }

  if (body.minOrderValue !== undefined) {
    ensureFieldAllowed(state, "min_order_value");
    const value = Number(body.minOrderValue);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Minimum order value must be zero or greater");
    }
    data.min_order_value = value;
  }

  if (body.startDate !== undefined) {
    ensureFieldAllowed(state, "start_date");
    const value = new Date(body.startDate);
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid start date");
    }
    data.start_date = value;
  }

  if (body.endDate !== undefined) {
    ensureFieldAllowed(state, "end_date");
    const value = new Date(body.endDate);
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid end date");
    }
    if (data.start_date) {
      if (value <= data.start_date) {
        throw new Error("End date must be later than start date");
      }
    } else if (value <= existing.start_date) {
      throw new Error("End date must be later than start date");
    }
    data.end_date = value;
  }

  if (body.totalUsageLimit !== undefined) {
    ensureFieldAllowed(state, "total_usage_limit");
    const value = Number(body.totalUsageLimit);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Total usage limit must be greater than 0");
    }
    data.total_usage_limit = value;
  }

  if (body.userUsageLimit !== undefined) {
    ensureFieldAllowed(state, "user_usage_limit");
    const value = Number(body.userUsageLimit);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("User usage limit must be greater than 0");
    }
    data.user_usage_limit = value;
  }

  if (body.status !== undefined) {
    ensureFieldAllowed(state, "status");
    data.status = body.status.toUpperCase();
  }

  const productIds = sanitizeIdArray(body.applicableProductIds);
  if (productIds !== undefined) {
    ensureFieldAllowed(state, "applicableProductIds");
  }

  const categoryIds = sanitizeIdArray(body.applicableCategoryIds);
  if (categoryIds !== undefined) {
    ensureFieldAllowed(state, "applicableCategoryIds");
  }

  return {
    state,
    data,
    productIds,
    categoryIds,
  };
}

export async function GET(request, { params }) {
  const { campaignId } = params;
  try {
    const { storeId } = await requireSellerContext();
    const voucher = await ensureStoreVoucher(campaignId, storeId);
    return NextResponse.json({ voucher });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const status = error.status || 500;
    if (status === 500) {
      console.error(
        `GET /api/store/vouchers/${campaignId} error`,
        error
      );
    }
    return NextResponse.json(
      { error: status === 404 ? "Voucher not found" : "Failed to fetch voucher" },
      { status }
    );
  }
}

export async function PUT(request, { params }) {
  const { campaignId } = params;
  try {
    const { storeId } = await requireSellerContext();
    const existing = await ensureStoreVoucher(campaignId, storeId);
    const state = determineVoucherState(existing);

    const body = await request.json();
    const updateData = {};

    const allowedFields = allowedFieldsByState[state] || new Set();

    // Build updateData from allowed fields
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        switch (field) {
          case 'name':
            updateData.name = body.name;
            break;
          case 'description':
            updateData.description = body.description;
            break;
          case 'voucher_code':
            updateData.voucher_code = body.voucher_code?.trim() || null;
            break;
          case 'discount_type':
            updateData.discount_type = body.discount_type;
            break;
          case 'discount_value':
            updateData.discount_value = Number(body.discount_value);
            break;
          case 'max_discount_amount':
            updateData.max_discount_amount = Number(body.max_discount_amount);
            break;
          case 'min_order_value':
            updateData.min_order_value = Number(body.min_order_value);
            break;
          case 'start_date':
            updateData.start_date = new Date(body.start_date);
            break;
          case 'end_date':
            updateData.end_date = new Date(body.end_date);
            break;
          case 'total_usage_limit':
            updateData.total_usage_limit = Number(body.total_usage_limit);
            break;
          case 'user_usage_limit':
            updateData.user_usage_limit = Number(body.user_usage_limit);
            break;
          case 'status':
            updateData.status = body.status;
            break;
          case 'applicableProductIds':
            const productIds = sanitizeIdArray(body.applicableProductIds);
            if (productIds) {
              await ensureProductsBelongToStore(productIds, storeId);
              updateData.applicableProducts = {
                set: productIds.map((id) => ({ id })),
              };
            }
            break;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ voucher: existing });
    }

    const voucher = await prisma.voucherCampaign.update({
      where: { id: existing.id },
      data: updateData,
      include: storeVoucherIncludeConfig(),
    });

    return NextResponse.json({ voucher });
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

    const status = error.status || 500;
    if (status === 500) {
      console.error(
        `PUT /api/store/vouchers/${campaignId} error`,
        error
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update voucher" },
      { status: status === 500 ? 500 : 400 } // Return 400 for business logic errors
    );
  }
}

export async function DELETE(request, { params }) {
  const { campaignId } = params;
  try {
    const { storeId } = await requireSellerContext();
    const existing = await ensureStoreVoucher(campaignId, storeId);
    const state = determineVoucherState(existing);

    if (state === "upcoming") {
      const usageCount = await prisma.userVoucher.count({
        where: { voucher_campaign_id: existing.id },
      });

      if (usageCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete a voucher that has been collected" },
          { status: 400 }
        );
      }

      await prisma.voucherCampaign.delete({ where: { id: existing.id } });
      return NextResponse.json({ message: "Voucher campaign deleted" });
    }

    if (state === "ongoing") {
      const voucher = await prisma.voucherCampaign.update({
        where: { id: existing.id },
        data: {
          status: "ENDED",
          end_date: new Date(),
        },
        include: storeVoucherIncludeConfig(),
      });
      return NextResponse.json({
        message: "Voucher marked as ended",
        voucher,
      });
    }

    return NextResponse.json(
      { error: "Voucher already ended or expired" },
      { status: 400 }
    );
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const status = error.status || 500;
    if (status === 500) {
      console.error(
        `DELETE /api/store/vouchers/${campaignId} error`,
        error
      );
    }
    return NextResponse.json(
      { error: "Failed to delete voucher" },
      { status }
    );
  }
}
