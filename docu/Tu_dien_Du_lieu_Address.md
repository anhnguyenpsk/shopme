### Từ điển Dữ liệu (Data Dictionary) - Bảng `Address`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho địa chỉ. |
| 2 | `userId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến người dùng sở hữu địa chỉ này (bảng `User`). |
| 3 | `name` | Not Null | `text` | Tên người nhận tại địa chỉ này. |
| 4 | `street` | Not Null | `text` | Tên đường, số nhà. |
| 5 | `city` | Not Null | `text` | Thành phố. |
| 6 | `state` | Not Null | `text` | Tỉnh/Bang. |
| 7 | `country` | Not Null | `text` | Quốc gia. |
| 8 | `phone` | Not Null | `text` | Số điện thoại liên hệ tại địa chỉ này. |
| 9 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo địa chỉ. |

**Quan hệ:**
-   `Address` N-1 `User`
-   `Address` 1-N `Order`
