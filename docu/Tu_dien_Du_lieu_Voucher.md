# Từ điển Dữ liệu (Data Dictionary) - Hệ thống Voucher Mới

## Bảng `VoucherCampaign`

Bảng này lưu trữ các "chiến dịch" hoặc "khuôn mẫu" của voucher, do Admin hoặc Chủ cửa hàng tạo ra. Nó định nghĩa các quy tắc và thuộc tính của một loại voucher.

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho chiến dịch voucher. |
| 2 | `name` | Not Null | `text` | Tên nội bộ của chiến dịch (ví dụ: "Sale 12.12 của Shop"). |
| 3 | `description` | Nullable | `text` | Mô tả công khai cho voucher (ví dụ: "Giảm 10% cho đồ điện tử"). |
| 4 | `voucher_code` | Unique, Nullable | `text` | Mã mà người dùng có thể nhập để nhận voucher (ví dụ: "SHOPME10K"). Null nếu là voucher dạng sưu tầm. |
| 5 | `voucher_type` | Not Null | `VoucherType` (Enum) | Loại voucher: `SHOP` (của cửa hàng), `PLATFORM` (của nền tảng), `SHIPPING` (phí vận chuyển). |
| 6 | `discount_type` | Not Null | `DiscountType` (Enum) | Loại giảm giá: `FIXED_AMOUNT` (số tiền cố định), `PERCENTAGE` (phần trăm). |
| 7 | `discount_value` | Not Null | `float` | Giá trị giảm giá (ví dụ: 10000 cho `FIXED_AMOUNT`, hoặc 10 cho `PERCENTAGE` 10%). |
| 8 | `max_discount_amount` | Nullable | `float` | Số tiền giảm giá tối đa có thể nhận được (chỉ áp dụng cho `PERCENTAGE`). |
| 9 | `min_order_value` | Not Null, Default: `0` | `float` | Giá trị đơn hàng tối thiểu để có thể áp dụng voucher. |
| 10 | `start_date` | Not Null | `timestamp` | Thời gian voucher bắt đầu có hiệu lực. |
| 11 | `end_date` | Not Null | `timestamp` | Thời gian voucher hết hiệu lực. |
| 12 | `total_usage_limit` | Not Null | `integer` | Tổng số lượt sử dụng tối đa cho toàn bộ chiến dịch (ví dụ: 1000 lượt). |
| 13 | `user_usage_limit` | Not Null, Default: `1` | `integer` | Số lần tối đa một người dùng có thể sử dụng voucher từ chiến dịch này. |
| 14 | `status` | Not Null, Default: `'ACTIVE'` | `text` | Trạng thái của chiến dịch (ví dụ: `ACTIVE`, `INACTIVE`, `EXHAUSTED`). |
| 15 | `created_by_shop_id` | Foreign Key, Nullable | `text` | Khóa ngoại liên kết đến `Store.id`. Null nếu là voucher của `PLATFORM` hoặc `SHIPPING`. |
| 16 | `createdAt` | Not Null, Default: `now()` | `timestamp` | Ngày tạo chiến dịch. |
| 17 | `updatedAt` | Not Null, Auto-updated | `timestamp` | Ngày cập nhật chiến dịch lần cuối. |

**Quan hệ:**
-   `VoucherCampaign` 1-N `UserVoucher`
-   `Store` 1-N `VoucherCampaign` (optional)
-   `VoucherCampaign` M-N `Product` (optional)
-   `VoucherCampaign` M-N `Category` (optional)

---

## Bảng `UserVoucher`

Bảng này đại diện cho một voucher cụ thể mà người dùng đã "sưu tầm" vào "ví" của họ. Mỗi bản ghi là một "phiên bản" của một `VoucherCampaign` dành riêng cho một người dùng.

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho voucher của người dùng. |
| 2 | `status` | Not Null, Default: `AVAILABLE` | `UserVoucherStatus` (Enum) | Trạng thái của voucher: `AVAILABLE` (có sẵn), `USED` (đã dùng), `EXPIRED` (hết hạn). |
| 3 | `collected_date` | Not Null, Default: `now()` | `timestamp` | Ngày người dùng sưu tầm voucher. |
| 4 | `used_date` | Nullable | `timestamp` | Ngày người dùng sử dụng voucher. |
| 5 | `user_id` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến `User.id`. |
| 6 | `voucher_campaign_id` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến `VoucherCampaign.id` để biết voucher này thuộc chiến dịch nào. |
| 7 | `used_in_order_id` | Foreign Key, Nullable | `text` | Khóa ngoại liên kết đến `Order.id` nơi voucher này đã được sử dụng. |

**Ràng buộc đặc biệt:**
-   `@@unique([user_id, voucher_campaign_id, used_in_order_id])`: Đảm bảo một người dùng không thể sưu tầm cùng một voucher cho cùng một đơn hàng nhiều lần.

**Quan hệ:**
-   `User` 1-N `UserVoucher`
-   `VoucherCampaign` 1-N `UserVoucher`
-   `Order` 1-N `UserVoucher` (optional)
