### Từ điển Dữ liệu (Data Dictionary) - Bảng `Order`

| STT | Tên (Attribute)       | Ràng buộc (Constraint)            | Kiểu (Type)            | Ý nghĩa (Meaning)                                                                        |
| :-: | :-------------------- | :-------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------- |
|  1  | `id`                  | Primary Key, Not Null             | `text`                 | Định danh duy nhất cho đơn hàng.                                                         |
|  2  | `paymentIntentId`     | Unique, Nullable                  | `text`                 | ID của giao dịch từ cổng thanh toán Stripe.                                              |
|  3  | `total`               | Not Null                          | `double precision`     | Tổng giá trị cuối cùng của đơn hàng (sau khi đã trừ giảm giá).                           |
|  4  | `totalDiscountAmount` | Not Null, Default: `0`            | `double precision`     | Tổng số tiền được giảm giá từ các voucher.                                               |
|  5  | `status`              | Not Null, Default: `ORDER_PLACED` | `OrderStatus` (Enum)   | Trạng thái xử lý của đơn hàng (ORDER_PLACED, PROCESSING, SHIPPED, DELIVERED, COMPLETED). |
|  6  | `userId`              | Foreign Key, Not Null             | `text`                 | Khóa ngoại liên kết đến người mua (bảng `User`).                                         |
|  7  | `storeId`             | Foreign Key, Not Null             | `text`                 | Khóa ngoại liên kết đến cửa hàng bán (bảng `Store`).                                     |
|  8  | `addressId`           | Foreign Key, Not Null             | `text`                 | Khóa ngoại liên kết đến địa chỉ giao hàng (bảng `Address`).                              |
|  9  | `isPaid`              | Not Null, Default: `false`        | `boolean`              | Cờ xác định đơn hàng đã được thanh toán hay chưa.                                        |
| 10  | `paymentMethod`       | Not Null                          | `PaymentMethod` (Enum) | Phương thức thanh toán đã sử dụng (COD, STRIPE).                                         |
| 11  | `createdAt`           | Not Null, Default: `now()`        | `timestamp(3)`         | Ngày tạo đơn hàng.                                                                       |
| 12  | `updatedAt`           | Not Null, Auto-updated            | `timestamp(3)`         | Ngày cập nhật đơn hàng lần cuối.                                                         |
| 13  | `deliveredAt`         | Nullable                          | `timestamp(3)`         | Thời gian giao hàng thành công.                                                          |
| 14  | `completedAt`         | Nullable                          | `timestamp(3)`         | Thời gian đơn hàng hoàn tất (người dùng xác nhận hoặc tự động).                          |

**Quan hệ:**

- `Order` 1-N `OrderItem`
- `Order` 1-N `UserVoucher` (Lưu các voucher đã được sử dụng trong đơn hàng này)
