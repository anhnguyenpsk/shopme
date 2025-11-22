### Từ điển Dữ liệu (Data Dictionary) - Bảng `Rating`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho đánh giá. |
| 2 | `rating` | Not Null | `integer` | Số sao đánh giá (từ 1 đến 5). |
| 3 | `review` | Not Null | `text` | Nội dung bình luận của đánh giá. |
| 4 | `userId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến người dùng đã đánh giá (bảng `User`). |
| 5 | `productId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến sản phẩm được đánh giá (bảng `Product`). |
| 6 | `orderId` | Not Null | `text` | ID của đơn hàng mà sản phẩm được đánh giá thuộc về. |
| 7 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo đánh giá. |
| 8 | `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật đánh giá lần cuối. |

**Ràng buộc đặc biệt:**
-   `(userId, productId, orderId)` là duy nhất để đảm bảo một người dùng chỉ có thể đánh giá một sản phẩm một lần cho mỗi đơn hàng.

**Quan hệ:**
-   `Rating` N-1 `User`
-   `Rating` N-1 `Product`
