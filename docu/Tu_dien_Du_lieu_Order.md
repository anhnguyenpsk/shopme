### Từ điển Dữ liệu (Data Dictionary) - Bảng `Order`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho đơn hàng. |
| 2 | `paymentIntentId` | Unique, Nullable | `text` | ID của giao dịch từ cổng thanh toán Stripe. |
| 3 | `total` | Not Null | `double precision` | Tổng giá trị cuối cùng của đơn hàng. |
| 4 | `status` | Not Null, Default: `ORDER_PLACED` | `OrderStatus` (Enum) | Trạng thái xử lý của đơn hàng (Đã đặt, Đang xử lý,...). |
| 5 | `userId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến người mua (bảng `User`). |
| 6 | `storeId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến cửa hàng bán (bảng `Store`). |
| 7 | `addressId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến địa chỉ giao hàng (bảng `Address`). |
| 8 | `isPaid` | Not Null, Default: `false` | `boolean` | Cờ xác định đơn hàng đã được thanh toán hay chưa. |
| 9 | `paymentMethod` | Not Null | `PaymentMethod` (Enum) | Phương thức thanh toán đã sử dụng (COD, STRIPE). |
| 10| `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo đơn hàng. |
| 11| `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật đơn hàng lần cuối. |
| 12| `isCouponUsed` | Not Null, Default: `false` | `boolean` | Cờ xác định đơn hàng có sử dụng mã giảm giá không. |
| 13| `coupon` | Not Null, Default: `{}` | `jsonb` | Lưu bản sao (snapshot) thông tin của coupon đã áp dụng. |
