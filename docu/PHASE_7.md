# Phase 7: Analytics & Reporting (Seller)

**Objective:** Provide analytics to sellers as defined in the business logic.

## 1. API Update

*   **File:** `app/api/store/vouchers/route.js` (GET endpoint)
    *   **Task:** Modify the Prisma query for the `GET` request to `include` relevant counts for analytics.
        *   Include a count for all `UserVoucher` instances associated with each `VoucherCampaign` to represent the total number of times a voucher has been "Collected".
            ```prisma
            _count: { select: { userVouchers: true } }
            ```
        *   Include a filtered count for `UserVoucher` instances where the `status` is `'USED'` to represent the total number of times a voucher has been "Used".
            ```prisma
            _count: { select: { userVouchers: { where: { status: 'USED' } } } }
            ```

## 2. Frontend UI

*   **File:** `app/store/vouchers/page.jsx`
    *   **Task:** Update the voucher listing table to display key analytics for each voucher campaign.
        *   Display the "Used / Total" metric, calculated as `_count.userVouchers_used` (from the API) divided by `campaign.total_usage_limit`.
    *   **Task:** Create a new UI component (either a dedicated page or a dialog) for "Voucher Details" to present a comprehensive analytics dashboard.
        *   This dashboard should display:
            *   Total Uses (from `_count.userVouchers_used`)
            *   Total Saves (from `_count.userVouchers`)
            *   Sales Generated (This will require additional logic to sum `Order.total` for orders where this voucher was used. This might involve a new API endpoint or a more complex Prisma query.)
            *   Total Discount (This will require additional logic to sum `Order.totalDiscountAmount` for orders where this voucher was used. This might involve a new API endpoint or a more complex Prisma query.)
