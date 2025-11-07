### Từ điển Dữ liệu (Data Dictionary) - Bảng `OrderItem`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `orderId` | Composite PK, Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến `Order`, là một phần của khóa chính. |
| 2 | `productId` | Composite PK, Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến `Product`, là một phần của khóa chính. |
| 3 | `quantity` | Not Null | `integer` | Số lượng sản phẩm được mua trong mục này. |
| 4 | `price` | Not Null | `double precision` | Giá của một đơn vị sản phẩm tại thời điểm mua. |

---

### Từ điển Dữ liệu (Data Dictionary) - Bảng `Rating`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho đánh giá. |
| 2 | `rating` | Not Null | `integer` | Số sao đánh giá (từ 1 đến 5). |
| 3 | `review` | Not Null | `text` | Nội dung bình luận chi tiết. |
| 4 | `userId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến người dùng đã viết đánh giá. |
| 5 | `productId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến sản phẩm được đánh giá. |
| 6 | `orderId` | Not Null, Unique (với userId, productId) | `text` | ID của đơn hàng chứa sản phẩm được đánh giá. |
| 7 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo đánh giá. |
| 8 | `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật đánh giá lần cuối. |

---

### Từ điển Dữ liệu (Data Dictionary) - Bảng `Address`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho địa chỉ. |
| 2 | `userId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến người dùng sở hữu địa chỉ. |
| 3 | `name` | Not Null | `text` | Tên người nhận hàng. |
| 4 | `street` | Not Null | `text` | Tên đường, số nhà. |
| 5 | `city` | Not Null | `text` | Thành phố. |
| 6 | `state` | Not Null | `text` | Tỉnh/Bang. |
| 7 | `country` | Not Null | `text` | Quốc gia. |
| 8 | `phone` | Not Null | `text` | Số điện thoại người nhận. |
| 9 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo địa chỉ. |

---

### Từ điển Dữ liệu (Data Dictionary) - Bảng `Coupon`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `code` | Primary Key, Not Null | `text` | Mã giảm giá duy nhất. |
| 2 | `description` | Not Null | `text` | Mô tả về chương trình giảm giá. |
| 3 | `discount` | Not Null | `double precision` | Mức giảm giá (dưới dạng số). |
| 4 | `forNewUser` | Not Null | `boolean` | Cờ xác định mã chỉ dành cho người dùng mới. |
| 5 | `forMember` | Not Null, Default: `false` | `boolean` | Cờ xác định mã chỉ dành cho thành viên. |
| 6 | `isPublic` | Not Null | `boolean` | Cờ xác định mã có được công khai hay không. |
| 7 | `expiresAt` | Not Null | `timestamp(3)` | Ngày hết hạn của mã. |
| 8 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo mã. |

---

## Các bảng phục vụ NextAuth

### Từ điển Dữ liệu (Data Dictionary) - Bảng `Account`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất. |
| 2 | `userId` | Foreign Key, Not Null | `text` | Liên kết đến bảng `User`. |
| 3 | `type` | Not Null | `text` | Loại tài khoản (ví dụ: 'oauth', 'email'). |
| 4 | `provider` | Not Null | `text` | Tên nhà cung cấp (ví dụ: 'google', 'facebook', 'credentials'). |
| 5 | `providerAccountId` | Not Null | `text` | ID của người dùng từ nhà cung cấp. |
| 6 | `refresh_token` | Nullable | `text` | Refresh token từ OAuth provider. |
| 7 | `access_token` | Nullable | `text` | Access token từ OAuth provider. |
| 8 | `expires_at` | Nullable | `integer` | Thời gian hết hạn của token (Unix timestamp). |
| 9 | `token_type` | Nullable | `text` | Loại token (ví dụ: 'Bearer'). |
| 10 | `scope` | Nullable | `text` | Phạm vi quyền truy cập của token. |
| 11 | `id_token` | Nullable | `text` | ID token từ OpenID Connect. |
| 12 | `session_state` | Nullable | `text` | Trạng thái session từ provider. |

**Lưu ý:** Hệ thống sử dụng JWT session strategy của NextAuth, không sử dụng database session (bảng Session không tồn tại).
