import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  requireAuthSession,
  isHttpError,
} from "@/lib/auth/guards";
import {
  buildCartSnapshot,
  evaluateVoucherAgainstCart,
  groupVoucherResultsByType,
} from "@/lib/vouchers/validation";

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await requireAuthSession();
    const body = await request.json();
    const cartItems = body?.cartItems;
    const shippingFeeRaw = body?.shippingFee ?? 0;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "cartItems must be a non-empty array" },
        { status: 400 }
      );
    }

    const shippingFee = Number.isFinite(Number(shippingFeeRaw))
      ? Math.max(0, Number(shippingFeeRaw))
      : 0;

    const cartSnapshot = await buildCartSnapshot(cartItems);

    if (!cartSnapshot.lines.length) {
      return NextResponse.json(
        { error: "No valid products found for the provided cart items" },
        { status: 400 }
      );
    }

    const vouchers = await prisma.userVoucher.findMany({
      where: {
        user_id: session.user.id,
        status: "AVAILABLE",
      },
      include: {
        voucherCampaign: {
          include: {
            applicableProducts: { select: { id: true, name: true, storeId: true } },
            applicableCategories: { select: { id: true, name: true } },
          },
        },
      },
    });

    const validResults = [];
    const invalidResults = [];

    for (const voucher of vouchers) {
      const result = evaluateVoucherAgainstCart({
        campaign: voucher.voucherCampaign,
        userVoucher: voucher,
        cartLines: cartSnapshot.lines,
        shippingFee,
      });

      if (result.isValid) {
        validResults.push(result);
      } else {
        invalidResults.push({
          userVoucherId: voucher.id,
          campaignId: voucher.voucher_campaign_id,
          code: result.code,
          reason: result.reason,
        });
      }
    }

    const grouped = groupVoucherResultsByType(validResults);

    return NextResponse.json({
      SHOP: grouped.SHOP,
      PLATFORM: grouped.PLATFORM,
      SHIPPING: grouped.SHIPPING,
      invalid: invalidResults,
      cart: {
        subtotal: cartSnapshot.subtotal,
        invalidItems: cartSnapshot.invalidItems,
      },
    });
  } catch (error) {
    if (isHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("POST /api/checkout/validate-vouchers error", error);
    return NextResponse.json(
      { error: "Failed to validate vouchers" },
      { status: 500 }
    );
  }
}
