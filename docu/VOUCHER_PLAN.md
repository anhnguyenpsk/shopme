Here is the detailed action plan to implement the new, advanced voucher system.

# Voucher System Overhaul Action Plan

## Overview

The goal is to deprecate the existing simple `Coupon` model and replace it with a comprehensive, multi-layered voucher system. This new system will support three distinct voucher types (`PLATFORM`, `SHOP`, `SHIPPING`), advanced discount rules, product-specific application, and a "Voucher Wallet" for users, enabling the stacking of different voucher types during checkout.

This plan will be executed in phases to ensure a clean migration from the old system to the new one.

-----

## Phase 1: Database Schema (Prisma) Refactor

**Objective:** Update the database schema to remove the old `Coupon` model and introduce the new, flexible voucher models.

  * **File:** `prisma/schema.prisma`

<!-- end list -->

1.  **Drop Old Model:**

      * Remove the entire `model Coupon`.

2.  **Modify `Order` Model:**

      * Remove the `isCouponUsed` and `coupon` fields.
      * Add `totalDiscountAmount` to store the calculated discount value:
        ```prisma
        totalDiscountAmount Float @default(0)
        ```
      * Add a one-to-many relation to `UserVoucher` to track which vouchers were used:
        ```prisma
        userVouchers UserVoucher[]
        ```

3.  **Add New Enums:**

      * Define the different types of vouchers, discounts, and statuses.
        ```prisma
        enum VoucherType {
          SHOP        // Created by Store Owner, applies only to their store
          PLATFORM    // Created by Admin, applies platform-wide
          SHIPPING    // Created by Admin, applies to shipping fees
        }

        enum DiscountType {
          FIXED_AMOUNT // e.g., 10,000 VND
          PERCENTAGE   // e.g., 10%
        }

        enum UserVoucherStatus {
          AVAILABLE   // In the user's wallet, ready to use
          USED        // Applied to a completed order
          EXPIRED     // Expired before use
        }
        ```

4.  **Create `VoucherCampaign` Model (The "Template"):**

      * This model defines the *rules* of a voucher, created by an Admin or Store Owner.
        ```prisma
        model VoucherCampaign {
          id                    String         @id @default(cuid())
          name                  String         // Internal name (e.g., "Seller's 12.12 Sale")
          description           String?        // Public description (e.g., "10% off all electronics")
          voucher_code          String?        @unique // The code user can type, e.g., "SHOPME10K" (nullable for click-to-collect)
          voucher_type          VoucherType
          discount_type         DiscountType
          discount_value        Float          // e.g., 10000 (for FIXED) or 10 (for 10%)
          max_discount_amount   Float?         // Max discount for PERCENTAGE type
          min_order_value       Float          @default(0) // Minimum order total to apply
          start_date            DateTime
          end_date              DateTime
          total_usage_limit     Int            // The global pool of uses (e.g., 100 uses total)
          user_usage_limit      Int            @default(1) // How many times one user can use this (e.g., 5)
          status                String         @default("ACTIVE") // e.g., ACTIVE, INACTIVE, EXHAUSTED

          created_by_shop_id    String?
          store                 Store?         @relation(fields: [created_by_shop_id], references: [id])
          
          userVouchers          UserVoucher[]  // All user instances of this campaign
          
          // M2M relations for product/category-specific vouchers
          applicableProducts    Product[]
          applicableCategories  Category[]

          createdAt             DateTime       @default(now())
          updatedAt             DateTime       @updatedAt
        }
        ```

5.  **Create `UserVoucher` Model (The "Instance"):**

      * This model represents a specific voucher in a user's "wallet".
        ```prisma
        model UserVoucher {
          id                  String            @id @default(cuid())
          status              UserVoucherStatus @default(AVAILABLE)
          collected_date      DateTime          @default(now())
          used_date           DateTime?

          user_id             String
          user                User              @relation(fields: [user_id], references: [id], onDelete: Cascade)
          
          voucher_campaign_id String
          voucherCampaign     VoucherCampaign   @relation(fields: [voucher_campaign_id], references: [id], onDelete: Cascade)

          used_in_order_id    String?
          order               Order?            @relation(fields: [used_in_order_id], references: [id], onDelete: SetNull)

          @@unique([user_id, voucher_campaign_id, used_in_order_id]) // Prevent duplicate saves for same order
        }
        ```

6.  **Update `Product` and `Category` Models:**

      * Add the many-to-many relation back to `VoucherCampaign`.
        ```prisma
        // In model Product
        voucherCampaigns   VoucherCampaign[]

        // In model Category
        voucherCampaigns   VoucherCampaign[]
        ```

7.  **Create Migration File:**

      * Run `npx prisma migrate dev --name init_voucher_system` to generate the new SQL migration file and apply it.

-----

## Phase 2: Old Coupon System Removal (Cleanup)

**Objective:** Purge all code related to the old `Coupon` system.

1.  **API Routes (Delete):**

      * `app/api/admin/coupons/route.js`
      * `app/api/admin/coupons/[code]/route.js`/route.js]

2.  **Frontend Page (Delete):**

      * `app/admin/coupons/page.jsx`

3.  **Sidebar Link (Modify):**

      * `components/admin/AdminSidebar.jsx`: Change the "Coupons" link to point to the new vouchers page.
          * From: `{ name: 'Coupons', href: '/admin/coupons', ... }`
          * To: `{ name: 'Vouchers', href: '/admin/vouchers', icon: TicketPercentIcon }`

4.  **Checkout & Order Logic (Modify):**

      * `app/api/orders/route.js`: In `POST`, remove all logic referencing `coupon`.
      * `app/api/stripe/create-payment-intent/route.js`: In `POST`, remove `coupon` from the body and from the Stripe `metadata`.
      * `app/api/stripe/webhook/route.js`: In `POST`, remove all logic for parsing `coupon` from `metadata`.
      * `components/OrderSummary.jsx`: Remove `couponCodeInput`, `coupon`, and `handleCouponCode` state and logic.

-----

## Phase 3: Backend API Implementation (Voucher Lifecycle)

**Objective:** Create new API endpoints for Admins, Store Owners, and Customers to manage and use the new voucher system.

1.  **Admin APIs (Platform & Shipping Vouchers):**

      * **New File:** `app/api/admin/vouchers/route.js`
          * `GET`: List all `VoucherCampaign`s (with filters for `PLATFORM`, `SHIPPING`).
          * `POST`: Create a new `VoucherCampaign` where `voucher_type` is `PLATFORM` or `SHIPPING` and `created_by_shop_id` is `null`. Must be `ADMIN` role.
      * **New File:** `app/api/admin/vouchers/[campaignId]/route.js`
          * `GET`: Get details of one campaign.
          * `PUT`: Update a campaign.
          * `DELETE`: Delete a campaign.

2.  **Store Owner APIs (Shop Vouchers):**

      * **New File:** `app/api/store/vouchers/route.js`
          * `GET`: List `VoucherCampaign`s where `created_by_shop_id` matches the logged-in seller's `storeId` (use `authSeller`).
          * `POST`: Create a new `VoucherCampaign`, automatically setting `voucher_type: 'SHOP'` and `created_by_shop_id` to the seller's `storeId`. Must validate that `applicableProducts` (if provided) belong to this store.
      * **New File:** `app/api/store/vouchers/[campaignId]/route.js`
          * `GET`: Get a single campaign, ensuring it belongs to the seller.
          * `PUT`: Update a campaign, ensuring it belongs to the seller. Must implement business logic from the image (e.g., cannot edit `discount_value` on "Ongoing" vouchers).
          * `DELETE`: Delete a campaign ("Upcoming") or set status to "Ended" ("Ongoing"), ensuring it belongs to the seller.

3.  **Customer APIs (Wallet & Checkout):**

      * **New File:** `app/api/user/vouchers/route.js`
          * `GET`: Get the user's "wallet". Fetches all `UserVoucher` records for the logged-in `session.user.id`/route.js], joining `voucherCampaign` details.
          * `POST`: "Collect" a voucher. Body: `{ voucher_campaign_id }`. Creates a `UserVoucher` record with `status: 'AVAILABLE'`. Must check `user_usage_limit` and `total_usage_limit`.
      * **New File:** `app/api/checkout/validate-vouchers/route.js`
          * `POST`: The "Checkout Helper". Body: `{ cartItems }` (from `cartSlice.js`).
          * Fetches all `AVAILABLE` vouchers from the user's wallet (`GET /api/user/vouchers`).
          * Validates each voucher against the `cartItems` (checks `min_order_value`, store/product applicability).
          * Returns a grouped list: `{ "SHOP": [...validShopVouchers], "PLATFORM": [...validPlatformVouchers], "SHIPPING": [...validShippingVouchers] }`.
      * **New File:** `app/api/vouchers/public/route.js`
          * `GET`: Publicly fetch "collectible" vouchers.
          * Params: `?storeId=...` or `?productId=...`.
          * Returns `VoucherCampaign`s that users can see and "collect".

-----

## Phase 4: Frontend Implementation (Admin & Store Owner)

**Objective:** Build the new UI for creating and managing vouchers, replacing the old "Coupons" page.

1.  **Admin UI:**

      * **New Page:** `app/admin/vouchers/page.jsx`
          * Create a new page using `Card`, `Table`, `Dialog`, and `Button`.
          * This UI will call `app/api/admin/vouchers` to list and create `PLATFORM` and `SHIPPING` vouchers.
      * **Sidebar:** `components/admin/AdminSidebar.jsx` link already updated in Phase 2.

2.  **Store Owner UI:**

      * **New Page:** `app/store/vouchers/page.jsx`
          * Create a new page for sellers. This is the main implementation based on the user's business logic.
          * Must implement tabs: "All", "Ongoing", "Upcoming", "Expired" (as described in business logic).
          * Must include search by Voucher Name/Voucher Code.
          * The "Create/Edit" `Dialog` must have:
              * Radios for "Shop Voucher" vs. "Product Voucher".
              * A product selection modal (if "Product Voucher" is chosen) that lists the seller's own products (from `app/api/store/product/route.js`).
              * Radios for "Discount Amount (VNĐ)" vs. "Off %".
              * Conditional `Input` for "Max Discount Value".
              * Inputs for all rules (Name, Code, Effective Time, Usage Limits)..
          * Must call `app/api/store/vouchers` for all operations.
      * **Sidebar:** `components/store/StoreSidebar.jsx`
          * Add a new link to the `sidebarLinks` array:
            ```javascript
            { name: 'Vouchers', href: '/store/vouchers', icon: TicketPercentIcon }
            ```
      * **Analytics UI:**
          * On the `app/store/vouchers/page.jsx` list or a new details page, display the analytics (Used/Total, Total Saved, Sales Generated) as defined in the business logic.

-----

## Phase 5: Frontend Implementation (Customer Experience)

**Objective:** Build the new UI for customers to "Collect" and "Use" vouchers.

1.  **Voucher "Collect" UI:**

      * `app/(public)/shop/[username]/page.jsx`: Fetch data from `GET /api/vouchers/public?storeId=...` and display collectible vouchers for that store. Add "Collect" buttons that call `POST /api/user/vouchers`/page.jsx].
      * `app/(public)/product/[productId]/page.jsx`: Fetch from `GET /api/vouchers/public?productId=...` and display applicable vouchers. Add "Collect" buttons/page.jsx].

2.  **Voucher "Wallet" UI:**

      * `app/(public)/account/page.jsx`:
          * Add a new "My Vouchers" tab.
          * This tab will fetch from `GET /api/user/vouchers`.
          * Display vouchers with tabs for "Available", "Used", "Expired".

3.  **Checkout Refactor (Critical):**

      * `components/OrderSummary.jsx`:
          * Remove old `couponCodeInput` form.
          * Add state: `const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false)`.
          * Add state: `const [selectedVouchers, setSelectedVouchers] = useState({ SHOP: null, PLATFORM: null, SHIPPING: null })`.
          * Add a `<Button variant="outline">` labeled "Select Voucher" that sets `isVoucherModalOpen(true)`.
          * Update `payableTotal` calculation to iterate through `selectedVouchers` and apply their discounts.
          * Pass the *list* of selected voucher IDs (`Object.values(selectedVouchers).filter(Boolean).map(v => v.id)`) to `finalizeOrder` and `StripePayment` components.
      * **New Component:** `components/VoucherSelectionModal.jsx`
          * Use `Dialog` and `DialogContent`.
          * On open (`useEffect`), call `POST /api/checkout/validate-vouchers` with `cartItems` from Redux.
          * Display the returned, validated vouchers in groups (e.g., "Shop Vouchers", "Platform Vouchers").
          * Use radio buttons or similar to allow selection (1 per group).
          * On "Apply", call a callback function to update the `selectedVouchers` state in `OrderSummary.jsx`.

-----

## Phase 6: Checkout & Payment Logic Integration

**Objective:** Connect the new frontend selection to the backend order creation logic.

1.  **Stripe Payment Intent:**

      * `components/StripePayment.jsx`: Modify `useEffect` that creates the Payment Intent.
          * It now receives `userVoucherIds` (array) instead of `coupon` (object).
          * It must pass this array to `POST /api/stripe/create-payment-intent`.
      * `app/api/stripe/create-payment-intent/route.js`:
          * Accept `userVoucherIds` (array).
          * **CRITICAL:** Validate the vouchers *again* on the server side (call the validation logic from Phase 3).
          * Calculate the *final server-side total* after discount. This must match `amount`.
          * Pass `userVoucherIds: JSON.stringify(userVoucherIds)` into the Stripe `metadata`.

2.  **Order Creation (API):**

      * `app/api/orders/route.js`:
          * Accept `userVoucherIds` (array).
          * Validate the vouchers *again* (server-side).
          * Calculate the total discount.
          * Inside the `prisma.$transaction`:
              * When creating the `Order`, save the calculated discount to the new `totalDiscountAmount` column.
              * After creating the `Order`, add a new step:
                ```javascript
                await tx.userVoucher.updateMany({
                  where: { 
                    id: { in: userVoucherIds },
                    user_id: session.user.id
                  },
                  data: {
                    status: 'USED',
                    used_in_order_id: newOrder.id, // 'newOrder' is the order created above
                    used_date: new Date()
                  }
                });
                ```

3.  **Stripe Webhook:**

      * `app/api/stripe/webhook/route.js`:
          * Read `userVoucherIds` from `metadata: JSON.parse(metadata.userVoucherIds || '[]')`.
          * The transaction logic must be identical to `app/api/orders/route.js`: create the `Order` (with `totalDiscountAmount`) and then `updateMany` `UserVoucher` records to `USED`.

-----

## Phase 7: Analytics & Reporting (Seller)

**Objective:** Provide analytics to sellers as defined in the business logic.

1.  **API Update:**
      * `app/api/store/vouchers/route.js` (GET):
          * Modify the Prisma query to `include` counts.
          * `_count: { select: { userVouchers: true } }` (Gives total "Collected").
          * `_count: { select: { userVouchers: { where: { status: 'USED' } } } }` (Gives total "Used").
2.  **Frontend UI:**
      * `app/store/vouchers/page.jsx`: In the table, display the "Used / Total" (e.g., `_count.userVouchers_used` / `campaign.total_usage_limit`).
      * Create the (Voucher Details) page or dialog to show the full analytics dashboard (Total Uses, Total Saves, Sales Generated, Total Discount).