# Phase 4 Frontend Plan

## Admin Voucher Management

- Build `[app/admin/vouchers/page.jsx](app/admin/vouchers/page.jsx)` with list + creation dialog using existing shadcn `Card`, `Table`, `Dialog`, `Button` components.
- Wire data fetching/mutations to `GET/POST/PUT/DELETE` on `[app/api/admin/vouchers](app/api/admin/vouchers)` using the shared fetch helper.
- Implement form validation (react-hook-form + zod) for discount fields, enforcing `max_discount_amount` only on percentage vouchers.

## Shared UI/Utilities

- Extract a reusable `VoucherForm` component under `[components/vouchers/VoucherForm.jsx](components/vouchers/VoucherForm.jsx)` to share between admin/store flows; accept props for mode (create/edit), voucher type restrictions, and submit handlers.
- Add helpers under `[lib/vouchers.ts](lib/vouchers.ts)` for mapping enum values to labels, formatting discount rules, and filtering by status/date ranges.

## Store Owner Dashboard

- Create `[app/store/vouchers/page.jsx](app/store/vouchers/page.jsx)` with tabs (All/Ongoing/Upcoming/Expired), search input, analytics summary cards, and actions calling `[app/api/store/vouchers](app/api/store/vouchers)`.
- Implement product selector dialog sourcing data from `[app/api/store/products](app/api/store/products)` and enforce ownership in UI.
- Integrate create/edit/delete flows via `VoucherForm`, respecting business rules (e.g., lock discount fields for ongoing vouchers, disable delete on active ones).

## Navigation & Permissions

- Update `[components/store/StoreSidebar.jsx](components/store/StoreSidebar.jsx)` to include the new vouchers link with `TicketPercentIcon`.
- Ensure role-guard wrappers (e.g., `withAdminAuth`, `authSeller`) protect new pages; redirect unauthorized users.