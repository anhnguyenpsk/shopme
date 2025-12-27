import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAuthSession,
  isHttpError,
} from "@/lib/auth/guards";

export const dynamic = 'force-dynamic';

function includeCampaign() {
  return {
    voucherCampaign: {
      include: {
        applicableProducts: { select: { id: true, name: true, storeId: true } },
        applicableCategories: { select: { id: true, name: true } },
      },
    },
  };
}

function normalizeVoucherCampaign(voucher) {
  const now = new Date();
  const campaign = voucher.voucherCampaign;
  const state =
    campaign.end_date < now
      ? "expired"
      : campaign.start_date > now
        ? "upcoming"
        : "ongoing";

  return {
    ...voucher,
    state,
  };
}

export async function GET() {
  try {
    const session = await requireAuthSession();
    const vouchers = await prisma.userVoucher.findMany({
      where: { user_id: session.user.id },
      orderBy: { collected_date: "desc" },
      include: includeCampaign(),
    });

    return NextResponse.json({
      vouchers: vouchers.map(normalizeVoucherCampaign),
    });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("GET /api/user/vouchers error", error);
    return NextResponse.json(
      { error: "Failed to fetch user vouchers" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await requireAuthSession();
    const body = await request.json();
    const campaignId = body?.voucher_campaign_id;

    if (!campaignId || typeof campaignId !== "string") {
      console.error("Voucher POST error: Missing or invalid campaignId", campaignId);
      return NextResponse.json(
        { error: "voucher_campaign_id is required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.voucherCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      console.error("Voucher POST error: Campaign not found", campaignId);
      return NextResponse.json({ error: "Voucher campaign not found" }, { status: 404 });
    }

    const now = new Date();
    // Allow pre-collection of upcoming vouchers (Option 2)
    // if (campaign.start_date > now) { ... } -> Removed

    if (campaign.end_date < now) {
      console.error("Voucher POST error: Campaign expired", campaign.end_date);
      return NextResponse.json(
        { error: "Voucher campaign has expired" },
        { status: 400 }
      );
    }

    if (campaign.status && campaign.status.toUpperCase() !== "ACTIVE") {
      console.error("Voucher POST error: Campaign inactive", campaign.status);
      return NextResponse.json(
        { error: "Voucher campaign is not active" },
        { status: 400 }
      );
    }

    try {
      const voucher = await prisma.$transaction(async (tx) => {
        const totalCollected = await tx.userVoucher.count({
          where: { voucher_campaign_id: campaign.id },
        });

        if (totalCollected >= campaign.total_usage_limit) {
          throw Object.assign(new Error("Voucher campaign usage limit reached"), {
            status: 400,
          });
        }

        const userCollected = await tx.userVoucher.count({
          where: {
            voucher_campaign_id: campaign.id,
            user_id: session.user.id,
          },
        });

        if (userCollected >= campaign.user_usage_limit) {
          throw Object.assign(new Error("You have reached the collection limit for this voucher"), {
            status: 400,
          });
        }

        return tx.userVoucher.create({
          data: {
            user_id: session.user.id,
            voucher_campaign_id: campaign.id,
          },
          include: includeCampaign(),
        });
      });

      return NextResponse.json({ voucher: normalizeVoucherCampaign(voucher) }, { status: 201 });
    } catch (transactionError) {
      if (transactionError.status) {
        console.error("Voucher POST transaction error:", transactionError.message);
        return NextResponse.json(
          { error: transactionError.message },
          { status: transactionError.status }
        );
      }
      throw transactionError;
    }
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error.code === "P2002") {
      console.error("Voucher POST error: P2002 Unique constraint (Already collected)");
      return NextResponse.json(
        { error: "Voucher already collected" },
        { status: 400 }
      );
    }

    console.error("POST /api/user/vouchers error", error);
    return NextResponse.json(
      { error: error.message || "Failed to collect voucher" },
      { status: 400 }
    );
  }
}
