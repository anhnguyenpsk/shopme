# Phase 6: Checkout & Payment Logic Integration

**Objective:** Connect the new frontend selection to the backend order creation logic.

## 1. Stripe Payment Intent

*   **File:** `components/StripePayment.jsx`
    *   **Task:** Modify the `useEffect` hook that creates the Payment Intent.
        *   It should now receive `userVoucherIds` (an array of IDs) instead of a single `coupon` object.
        *   It must pass this `userVoucherIds` array to the `POST /api/stripe/create-payment-intent` endpoint.

*   **File:** `app/api/stripe/create-payment-intent/route.js`
    *   **Task:** Update the API endpoint to accept `userVoucherIds` (array) in the request body.
        *   **CRITICAL:** Re-validate the vouchers on the server side using the validation logic established in Phase 3.
        *   Calculate the *final server-side total* after applying the voucher discounts. This calculated total must match the `amount` received in the request to prevent tampering.
        *   Pass the `userVoucherIds` array, converted to a JSON string (e.g., `JSON.stringify(userVoucherIds)`), into the Stripe `metadata` for later retrieval by the webhook.

## 2. Order Creation (API)

*   **File:** `app/api/orders/route.js`
    *   **Task:** Update the API endpoint to accept `userVoucherIds` (array) in the request body.
        *   **CRITICAL:** Re-validate the vouchers on the server side (using the validation logic from Phase 3) to ensure integrity.
        *   Calculate the total discount amount based on the validated vouchers.
        *   Inside the `prisma.$transaction` block:
            *   When creating the `Order` record, save the calculated total discount to the new `totalDiscountAmount` column.
            *   After the `Order` is successfully created, add a new step to update the `UserVoucher` records:
                ```javascript
                await tx.userVoucher.updateMany({
                  where: { 
                    id: { in: userVoucherIds },
                    user_id: session.user.id // Ensure only the current user's vouchers are updated
                  },
                  data: {
                    status: 'USED',
                    used_in_order_id: newOrder.id, // 'newOrder' is the order record created in the same transaction
                    used_date: new Date()
                  }
                });
                ```

## 3. Stripe Webhook

*   **File:** `app/api/stripe/webhook/route.js`
    *   **Task:** Modify the webhook handler to correctly process voucher information for orders paid via Stripe.
        *   Read the `userVoucherIds` from the Stripe `metadata` by parsing the JSON string: `JSON.parse(metadata.userVoucherIds || '[]')`.
        *   The transaction logic for creating the `Order` and updating the `UserVoucher` records must be identical to the logic implemented in `app/api/orders/route.js` (i.e., create the `Order` with `totalDiscountAmount` and then `updateMany` `UserVoucher` records to `USED`).
