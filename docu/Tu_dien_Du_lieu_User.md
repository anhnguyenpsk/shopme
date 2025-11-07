### Từ điển Dữ liệu (Data Dictionary) - Bảng `User`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho người dùng. |
| 2 | `name` | Nullable | `text` | Tên hiển thị của người dùng. |
| 3 | `email` | Unique, Nullable | `text` | Địa chỉ email để đăng nhập. |
| 4 | `emailVerified` | Nullable | `timestamp(3)` | Thời điểm email đã được xác thực. |
| 5 | `image` | Nullable | `text` | URL ảnh đại diện. |
| 6 | `hashedPassword` | Nullable | `text` | Mật khẩu đã được mã hóa. |
| 7 | `cart` | Not Null, Default: `{}` | `jsonb` | Dữ liệu giỏ hàng của người dùng. |
| 8 | `role` | Not Null, Default: `CUSTOMER` | `Role` (Enum) | Vai trò trong hệ thống (CUSTOMER, STORE_OWNER, ADMIN). |
| 9 | `isActive` | Not Null, Default: `true` | `boolean` | Cho biết tài khoản có đang hoạt động hay không (có thể bị vô hiệu hóa bởi Admin). |
| 10 | `phone` | Nullable | `text` | Số điện thoại của người dùng (định dạng Vietnam). |
| 11 | `gender` | Nullable | `text` | Giới tính của người dùng (male, female, other). |
| 12 | `dateOfBirth` | Nullable | `timestamp(3)` | Ngày sinh của người dùng. |
| 13 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo tài khoản. |
| 14 | `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật tài khoản lần cuối. |
