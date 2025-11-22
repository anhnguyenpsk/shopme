import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAdminSession,
  isHttpError,
} from "@/lib/auth/guards";
import {
  parseVoucherPayload,
  includeConfig,
  ADMIN_VOUCHER_TYPES,
} from "../route";

async function ensureAdminVoucher(campaignId) {
  if (!campaignId || typeof campaignId !== "string") {
    throw new Error("campaignId is required");
  }

  const voucher = await prisma.voucherCampaign.findFirst({
    where: { id: campaignId, created_by_shop_id: null },
    include: includeConfig(),
  });

  if (!voucher) {
    const error = new Error("Voucher campaign not found");
    error.status = 404;
    throw error;
  }

  if (!ADMIN_VOUCHER_TYPES.has(voucher.voucher_type)) {
    const error = new Error("Voucher campaign is not managed by admin");
    error.status = 403;
    throw error;
  }

  return voucher;
}

export async function GET(request, { params }) {
  try {
    await requireAdminSession();
    const voucher = await ensureAdminVoucher(params?.campaignId);
    return NextResponse.json({ voucher });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const status = error.status || 500;
    const message =
      status === 404
        ? "Voucher campaign not found"
        : "Failed to fetch voucher campaign";

    if (status === 500) {
      console.error(`GET /api/admin/vouchers/${params?.campaignId} error`, error);
    }

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdminSession();
    const existing = await ensureAdminVoucher(params?.campaignId);

    const body = await request.json();
    const payload = parseVoucherPayload({
      ...body,
      voucherType: existing.voucher_type,
    });

    const data = { ...payload };
    delete data.applicableProductIds;
    delete data.applicableCategoryIds;

    if (body.applicableProductIds !== undefined) {
      data.applicableProducts = {
        set: payload.applicableProductIds.map((id) => ({ id })),
      };
    }

    if (body.applicableCategoryIds !== undefined) {
      data.applicableCategories = {
        set: payload.applicableCategoryIds.map((id) => ({ id })),
      };
    }

    const voucher = await prisma.voucherCampaign.update({
      where: { id: existing.id },
      data,
      include: includeConfig(),
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
    const message =
      status === 404
        ? "Voucher campaign not found"
        : error.message || "Failed to update voucher campaign";

    if (status === 500) {
      console.error(
        `PUT /api/admin/vouchers/${params?.campaignId} error`,
        error
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdminSession();
    const existing = await ensureAdminVoucher(params?.campaignId);

    const usageCount = await prisma.userVoucher.count({
      where: { voucher_campaign_id: existing.id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete voucher campaign with collected vouchers" },
        { status: 400 }
      );
    }

    await prisma.voucherCampaign.delete({ where: { id: existing.id } });
    return NextResponse.json({ message: "Voucher campaign deleted" });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const status = error.status || 500;
    const message =
      status === 404
        ? "Voucher campaign not found"
        : "Failed to delete voucher campaign";

    if (status === 500) {
      console.error(
        `DELETE /api/admin/vouchers/${params?.campaignId} error`,
        error
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}


