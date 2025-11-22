import prisma from "@/lib/prisma";
import { buildCartSnapshot, evaluateVoucherAgainstCart } from "@/lib/vouchers/validation";

/**
 * A server-side function to re-validate selected vouchers against a cart and calculate the total discount.
 * This is a critical security step to run before creating an order or payment intent.
 *
 * @param {Object} options
 * @param {string[]} options.userVoucherIds - The IDs of the UserVoucher records to apply.
 * @param {Object[]} options.cartItems - The items from the user's cart.
 * @param {string} options.userId - The ID of the user applying the vouchers.
 * @param {number} [options.shippingFee=0] - The shipping fee for the order.
 * @returns {Promise<{totalDiscount: number, validationResults: Object[]}>}
 */
export async function calculateAndValidateVoucherDiscount({
  userVoucherIds,
  cartItems,
  userId,
  shippingFee = 0,
}) {
  if (!Array.isArray(userVoucherIds) || userVoucherIds.length === 0) {
    return { totalDiscount: 0, validationResults: [] };
  }

  // 1. Fetch the specific UserVoucher records
  const userVouchers = await prisma.userVoucher.findMany({
    where: {
      id: { in: userVoucherIds },
      user_id: userId,
      status: "AVAILABLE",
    },
    include: {
      voucherCampaign: {
        include: {
          applicableProducts: { select: { id: true } },
          applicableCategories: { select: { id: true } },
        },
      },
    },
  });

  // If the number of found vouchers doesn't match, some were invalid or didn't belong to the user
  if (userVouchers.length !== userVoucherIds.length) {
    throw new Error("One or more vouchers are invalid, already used, or do not belong to you.");
  }

  // 2. Build a snapshot of the cart for validation
  const cartSnapshot = await buildCartSnapshot(cartItems);
  if (cartSnapshot.lines.length === 0 && cartItems.length > 0) {
      throw new Error("No valid items in cart to apply vouchers to.");
  }

  // 3. Validate each voucher and check for type conflicts
  const validationResults = [];
  const appliedTypes = new Set();
  let totalDiscount = 0;

  for (const userVoucher of userVouchers) {
    const result = evaluateVoucherAgainstCart({
      campaign: userVoucher.voucherCampaign,
      userVoucher,
      cartLines: cartSnapshot.lines,
      shippingFee,
    });

    if (!result.isValid) {
      throw new Error(`Voucher "${userVoucher.voucherCampaign.name}" is not valid for this cart: ${result.reason}`);
    }

    const voucherType = userVoucher.voucherCampaign.voucher_type;
    if (appliedTypes.has(voucherType)) {
      throw new Error(`Cannot apply more than one "${voucherType}" voucher.`);
    }
    appliedTypes.add(voucherType);

    totalDiscount += result.discountAmount;
    validationResults.push(result);
  }

  // 4. Return the total discount and the detailed validation results
  return { totalDiscount, validationResults };
}