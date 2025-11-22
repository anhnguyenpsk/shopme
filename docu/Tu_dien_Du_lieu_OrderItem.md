### Từ điển Dữ liệu (Data Dictionary) - Bảng `OrderItem`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `orderId` | Primary Key, Foreign Key, Not Null | `text` | Định danh của đơn hàng mà sản phẩm này thuộc về (liên kết đến `Order.id`). |
| 2 | `productId` | Primary Key, Foreign Key, Not Null | `text` | Định danh của sản phẩm trong đơn hàng (liên kết đến `Product.id`). |
| 3 | `quantity` | Not Null | `integer` | Số lượng của sản phẩm này trong đơn hàng. |
| 4 | `price` | Not Null | `double precision` | Giá của sản phẩm tại thời điểm đặt hàng (để tránh thay đổi giá sau này). |

**Ràng buộc đặc biệt:**
-   `orderId` và `productId` tạo thành khóa chính kép (composite primary key) để đảm bảo mỗi sản phẩm chỉ xuất hiện một lần trong mỗi đơn hàng.

**Quan hệ:**
-   `OrderItem` N-1 `Order`
-   `OrderItem` N-1 `Product`
