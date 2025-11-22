# Thiết kế API Chi tiết - ShopMe (Phiên bản Hoàn thiện)

## 1. Tổng quan
Tài liệu này mô tả chi tiết các API của hệ thống ShopMe, bao gồm định dạng request, response và luồng xử lý cho từng chức năng.

### 1.1. Qui ước chung
- **Định dạng dữ liệu:** Toàn bộ request body và response body đều ở dạng `JSON`.
- **Authentication:** Sử dụng JWT. Các API yêu cầu xác thực phải gửi `access_token` qua `Authorization` header (`Bearer <token>`).
- **Cấu trúc Response:**
  ```json
  {
    "data": null | object | array,
    "message": "Thông báo kết quả",
    "status": 200 | 400 | 401 | 404 | 500
  }
  ```

---

## 2. Module Xác thực (Authentication)

### 2.1. API đăng ký (API-001)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/register` |
| **Method** | `POST` |
| **Request** | `{ "email": "user@example.com", "password": "password123", "name": "Nguyen Van A" }` |
| **Response** | **Thành công (201):** `{ "data": null, "message": "Đăng ký thành công, vui lòng kiểm tra email để xác thực.", "status": 201 }`<br>**Thất bại (400):** `{ "data": null, "message": "Email đã tồn tại.", "status": 400 }` |
| **Xử lý** | 1. Validate email và password.<br>2. Kiểm tra email đã tồn tại trong DB chưa.<br>3. Mã hóa mật khẩu (bcrypt).<br>4. Tạo một user mới với `role: 'CUSTOMER'` và `emailVerified: null`.<br>5. Tạo mã xác thực 6 chữ số và gửi email cho người dùng (thông qua Inngest). |

### 2.2. API Gửi lại mã xác thực (API-002)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/auth/send-verification` |
| **Method** | `POST` |
| **Request** | `{ "email": "user@example.com" }` |
| **Response** | `{ "data": null, "message": "Email xác thực đã được gửi.", "status": 200 }` |
| **Xử lý** | Gửi lại email chứa mã xác thực 6 chữ số cho các tài khoản chưa được kích hoạt. |

### 2.3. API xác thực tài khoản (API-003)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/auth/verify-email` |
| **Method** | `POST` |
| **Request** | `{ "email": "user@example.com", "token": "123456" }` |
| **Response** | **Thành công (200):** `{ "data": null, "message": "Xác thực tài khoản thành công.", "status": 200 }`<br>**Thất bại (400):** `{ "data": null, "message": "Mã xác thực không hợp lệ.", "status": 400 }` |
| **Xử lý** | Xác thực mã token, nếu đúng thì kích hoạt tài khoản (`emailVerified` != null). |

### 2.4. API đăng nhập (API-004)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/auth/credentials` (Nội bộ NextAuth) |
| **Method** | `POST` |
| **Request** | `{ "email": "user@example.com", "password": "password123" }` |
| **Response** | **Thành công (200):** `{ "data": { "user": {...}, "accessToken": "..." }, "message": "Đăng nhập thành công.", "status": 200 }`<br>**Thất bại (401):** `{ "data": null, "message": "Tài khoản hoặc mật khẩu không hợp lệ.", "status": 401 }` |
| **Xử lý** | Xác thực thông tin, trả về session token nếu thành công. |

### 2.5. API yêu cầu quên mật khẩu (API-005)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/auth/forgot-password` |
| **Method** | `POST` |
| **Request** | `{ "email": "user@example.com" }` |
| **Response** | `{ "data": null, "message": "Nếu email tồn tại, bạn sẽ nhận được một liên kết để reset mật khẩu.", "status": 200 }` |
| **Xử lý** | 1. Tìm user bằng email.<br>2. Nếu có, tạo một token reset mật khẩu duy nhất với thời gian hết hạn.<br>3. Gửi email cho người dùng chứa liên kết reset mật khẩu kèm token. |

### 2.6. API cài lại mật khẩu (API-006)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/auth/reset-password` |
| **Method** | `POST` |
| **Request** | `{ "token": "...", "newPassword": "..." }` |
| **Response** | `{ "data": null, "message": "Mật khẩu đã được thay đổi thành công.", "status": 200 }` |
| **Xử lý** | 1. Xác thực token.<br>2. Nếu token hợp lệ, tìm user tương ứng.<br>3. Mã hóa mật khẩu mới và cập nhật cho user.<br>4. Vô hiệu hóa token đã sử dụng. |

---

## 3. Module Người dùng (User)

### 3.1. API Lấy Profile Người dùng (API-007)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/user/profile` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | **Thành công (200):** `{ "data": { "id": "...", "name": "...", "email": "...", ... }, "status": 200 }`<br>**Thất bại (401):** `{ "data": null, "message": "Chưa xác thực.", "status": 401 }` |
| **Xử lý** | Lấy thông tin chi tiết của người dùng đang đăng nhập từ session token. |

### 3.2. API Cập nhật Profile Người dùng (API-008)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/user/profile` |
| **Method** | `PUT` |
| **Request** | `{ "name": "Tên mới", "phone": "0987654321", "gender": "male", ... }` |
| **Response** | **Thành công (200):** `{ "data": { ... }, "message": "Cập nhật thành công.", "status": 200 }`<br>**Thất bại (401):** `{ "data": null, "message": "Chưa xác thực.", "status": 401 }` |
| **Xử lý** | Cập nhật các thông tin cho phép (tên, sđt, giới tính, ngày sinh) cho người dùng. |

### 3.3. API Quản lý Giỏ hàng (API-009, 010)
| | API-009: Lấy Giỏ hàng | API-010: Đồng bộ Giỏ hàng |
| :--- | :--- | :--- |
| **Endpoint** | `/api/user/cart` | `/api/user/cart` |
| **Method** | `GET` | `POST` |
| **Request** | (Không có) | `{ "cartItems": [{ "productId": "...", "quantity": 2 }, ...] }` |
| **Response** | `{ "data": { "cartItems": [...] }, "status": 200 }` | `{ "data": null, "message": "Đồng bộ giỏ hàng thành công.", "status": 200 }` |
| **Xử lý** | Lấy thông tin giỏ hàng của user từ DB. | Lưu trạng thái giỏ hàng từ client vào trường `cart` trong bảng `User` của DB. |

### 3.4. API Lấy danh sách Địa chỉ (API-011)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/addresses` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | `{ "data": [ { "id": "...", "name": "...", ... } ], "status": 200 }` |
| **Xử lý** | Lấy tất cả địa chỉ thuộc về người dùng đang đăng nhập. |

### 3.5. API Thêm Địa chỉ mới (API-012)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/addresses` |
| **Method** | `POST` |
| **Request** | `{ "name": "Nhà", "street": "123 Đường ABC", "city": "Hanoi", ... }` |
| **Response** | `{ "data": { ... }, "message": "Thêm địa chỉ thành công.", "status": 201 }` |
| **Xử lý** | Tạo một địa chỉ mới và liên kết với `userId` của người dùng. |

### 3.6. API Sửa Địa chỉ (API-013)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/addresses/[id]` |
| **Method** | `PUT` |
| **Request** | `{ "name": "Nhà riêng", "street": "456 Đường XYZ", ... }` |
| **Response** | `{ "data": { ... }, "message": "Cập nhật địa chỉ thành công.", "status": 200 }` |
| **Xử lý** | Cập nhật địa chỉ có `id` tương ứng, đảm bảo nó thuộc về người dùng. |

### 3.7. API Xóa Địa chỉ (API-014)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/addresses/[id]` |
| **Method** | `DELETE` |
| **Request** | (Không có) |
| **Response** | `{ "data": null, "message": "Xóa địa chỉ thành công.", "status": 200 }` |
| **Xử lý** | Xóa địa chỉ có `id` tương ứng, đảm bảo nó thuộc về người dùng. |

### 3.8. API Lấy Ví Voucher (API-015)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/user/vouchers` |
| **Method** | `GET` |
| **Request** | Query: `?status=AVAILABLE` (hoặc `USED`, `EXPIRED`) |
| **Response** | `{ "data": [ { "id": "...", "status": "AVAILABLE", "voucherCampaign": {...} }, ... ], "status": 200 }` |
| **Xử lý** | Lấy danh sách `UserVoucher` của người dùng, join với thông tin `VoucherCampaign`. |

### 3.9. API Sưu tầm Voucher (API-016)
| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/user/vouchers` |
| **Method** | `POST` |
| **Request** | `{ "voucher_campaign_id": "..." }` |
| **Response** | `{ "data": { ... }, "message": "Sưu tầm voucher thành công.", "status": 201 }` |
| **Xử lý** | Tạo một bản ghi `UserVoucher` mới cho người dùng, kiểm tra các giới hạn về số lượng. |

---



## 4. Module Công khai (Public)



### 4.1. API Lấy danh sách Sản phẩm (API-017)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/products` |
| **Method** | `GET` |
| **Request** | Query params: `?page=1&limit=12&category=...&brand=...&sort=...` |
| **Response** | `{ "data": { "products": [...], "totalPages": 5 }, "status": 200 }` |
| **Xử lý** | Lấy danh sách sản phẩm có phân trang và bộ lọc. |



### 4.2. API Lấy sản phẩm Mới nhất (API-018)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/products/latest` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | `{ "data": [...], "status": 200 }` |
| **Xử lý** | Lấy danh sách các sản phẩm được tạo gần đây nhất. |



### 4.3. API Lấy sản phẩm Bán chạy (API-019)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/products/best-selling` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | `{ "data": [...], "status": 200 }` |
| **Xử lý** | Lấy danh sách sản phẩm bán chạy dựa trên số lượng đã bán trong `OrderItem`. |



### 4.4. API Lấy sản phẩm Nổi bật (API-020)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/products/featured` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | `{ "data": [...], "status": 200 }` |
| **Xử lý** | Lấy danh sách sản phẩm được đánh dấu là nổi bật (logic do admin quyết định). |



### 4.5. API Tìm kiếm Sản phẩm (API-021)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/products/search` |
| **Method** | `GET` |
| **Request** | Query: `?q=t-shirt` |
| **Response** | `{ "data": [...], "status": 200 }` |
| **Xử lý** | Trả về kết quả tìm kiếm sản phẩm theo từ khóa `q`. |



### 4.6. API Lấy chi tiết Sản phẩm (API-022)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/products/[id]` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | **Thành công (200):** `{ "data": { ... }, "status": 200 }`<br>**Thất bại (404):** `{ "data": null, "message": "Sản phẩm không tồn tại.", "status": 404 }` |
| **Xử lý** | Lấy thông tin chi tiết của một sản phẩm dựa trên `id`. |



### 4.7. API Lấy chi tiết Cửa hàng (API-023)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/store/[username]` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | **Thành công (200):** `{ "data": { ... }, "status": 200 }`<br>**Thất bại (404):** `{ "data": null, "message": "Cửa hàng không tồn tại.", "status": 404 }` |
| **Xử lý** | Lấy thông tin công khai của một cửa hàng dựa trên `username`. |



### 4.8. API Lấy chi tiết Danh mục (API-024)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/category/[slug]` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | **Thành công (200):** `{ "data": { ... }, "status": 200 }`<br>**Thất bại (404):** `{ "data": null, "message": "Danh mục không tồn tại.", "status": 404 }` |
| **Xử lý** | Lấy thông tin một danh mục dựa trên `slug`. |



### 4.9. API Lấy chi tiết Thương hiệu (API-025)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/brand/[slug]` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | **Thành công (200):** `{ "data": { ... }, "status": 200 }`<br>**Thất bại (404):** `{ "data": null, "message": "Thương hiệu không tồn tại.", "status": 404 }` |
| **Xử lý** | Lấy thông tin một thương hiệu dựa trên `slug`. |



### 4.10. API Lấy Voucher có thể sưu tầm (API-026)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/vouchers/public` |
| **Method** | `GET` |
| **Request** | Query: `?storeId=...` |
| **Response** | `{ "data": [...], "status": 200 }` |
| **Xử lý** | Lấy danh sách `VoucherCampaign` đang hoạt động, công khai, có thể áp dụng cho cửa hàng/sản phẩm. |



---



## 5. Module Thanh toán & Đơn hàng (Checkout & Order)



### 5.1. API tạo đơn hàng (COD) (API-027)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/orders` |
| **Method** | `POST` |
| **Request** | `{ "cartItems": [...], "addressId": "...", "userVoucherIds": ["..."] }` |
| **Response** | `{ "data": { "orderIds": [...] }, "message": "Tạo đơn hàng thành công.", "status": 201 }` |
| **Xử lý** | Validate, kiểm tra tồn kho, tạo đơn hàng, trừ kho, cập nhật voucher. |



### 5.2. API tạo phiên thanh toán Stripe (API-028)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/stripe/create-payment-intent` |
| **Method** | `POST` |
| **Request** | `{ "cartItems": [...], "addressId": "...", "userVoucherIds": ["..."] }` |
| **Response** | `{ "data": { "clientSecret": "..." }, "message": "Tạo phiên thanh toán thành công.", "status": 201 }` |
| **Xử lý** | Tính toán tổng tiền, tạo `PaymentIntent` của Stripe, trả về `clientSecret`. |



### 5.3. API gửi đánh giá sản phẩm (API-029)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/ratings` |
| **Method** | `POST` |
| **Request** | `{ "productId": "...", "orderId": "...", "rating": 5, "review": "..." }` |
| **Response** | `{ "data": { ... }, "message": "Cảm ơn bạn đã đánh giá.", "status": 201 }` |
| **Xử lý** | Kiểm tra điều kiện và lưu đánh giá vào DB. |



### 5.4. API kiểm tra voucher hợp lệ (API-030)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/checkout/validate-vouchers` |
| **Method** | `POST` |
| **Request** | `{ "cartItems": [...] }` |
| **Response** | `{ "data": { "SHOP": [...], "PLATFORM": [...], "SHIPPING": [...] }, "status": 200 }` |
| **Xử lý** | Đối chiếu voucher của user với giỏ hàng, trả về các voucher hợp lệ. |



---



## 6. Module Chủ cửa hàng (Store Owner)



### 6.1. API Đăng ký Cửa hàng (API-031)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/store/create` |
| **Method** | `POST` |
| **Request** | `{ "name": "...", "username": "...", ... }` |
| **Response** | `{ "data": { ... }, "message": "Đã gửi đơn đăng ký.", "status": 201 }` |
| **Xử lý** | Tạo một record `Store` mới với `status: 'pending'`. |



### 6.2. API Quản lý Cửa hàng (API-032, 033)

| | API-032: Lấy Cài đặt | API-033: Cập nhật Cài đặt |
| :--- | :--- | :--- |
| **Endpoint** | `/api/store/settings` | `/api/store/settings` |
| **Method** | `GET` | `PUT` |
| **Request** | (Không có) | `{ "name": "...", "logo": "..." }` |
| **Response** | `{ "data": { ... }, "status": 200 }` | `{ "data": { ... }, "status": 200 }` |
| **Xử lý** | Lấy thông tin chi tiết cửa hàng. | Cập nhật thông tin cửa hàng. |



### 6.3. API Quản lý Sản phẩm (API-034, 035, 036, 037)

| | API-034: Lấy DS | API-035: Thêm | API-036: Sửa | API-037: Bật/tắt tồn kho |
| :--- | :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/store/product` | `/api/store/product` | `/api/store/product/[id]` | `/api/store/stock-toggle` |
| **Method** | `GET` | `POST` | `PUT` | `PUT` |
| **Request** | (Không có) | `{ "name": "...", ... }` | `{ "name": "...", ... }` | `{ "productId": "...", "inStock": false }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 201 }` | `{ "data": {...}, "status": 200 }` | `{ "data": null, "status": 200 }` |
| **Xử lý** | Lấy DS sản phẩm. | Thêm sản phẩm. | Sửa sản phẩm. | Bật/tắt `inStock`. |



### 6.4. API Quản lý Đơn hàng (API-038, 039)

| | API-038: Lấy DS Đơn hàng | API-039: Cập nhật Đơn hàng |
| :--- | :--- | :--- |
| **Endpoint** | `/api/store/orders` | `/api/store/orders/[id]` |
| **Method** | `GET` | `PUT` |
| **Request** | (Không có) | `{ "status": "SHIPPED" }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy DS đơn hàng của cửa hàng. | Cập nhật trạng thái đơn hàng. |



### 6.5. API Quản lý Voucher (API-040, 041, 042)

| | API-040: Lấy DS | API-041: Thêm | API-042: Sửa |
| :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/store/vouchers` | `/api/store/vouchers` | `/api/store/vouchers/[id]` |
| **Method** | `GET` | `POST` | `PUT` |
| **Request** | (Không có) | `{ "name": "...", ... }` | `{ "name": "...", ... }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 201 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy DS voucher của cửa hàng. | Tạo voucher mới. | Sửa voucher. |



### 6.6. API lấy thống kê Dashboard (API-043)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/store/dashboard` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | `{ "data": { "totalRevenue": ..., "orderCount": ... }, "status": 200 }` |
| **Xử lý** | Tổng hợp các số liệu thống kê cho cửa hàng. |



---



## 7. Module Quản trị viên (Admin)



### 7.1. API Quản lý Người dùng (API-044, 045)

| | API-044: Lấy DS | API-045: Cập nhật |
| :--- | :--- | :--- |
| **Endpoint** | `/api/admin/users` | `/api/admin/users/[id]` |
| **Method** | `GET` | `PUT` |
| **Request** | (Không có) | `{ "isActive": false, "role": "..." }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy DS tất cả người dùng. | Cập nhật `isActive` hoặc `role`. |



### 7.2. API Quản lý Cửa hàng (API-046, 047)

| | API-046: Lấy DS | API-047: Cập nhật |
| :--- | :--- | :--- |
| **Endpoint** | `/api/admin/stores` | `/api/admin/stores` |
| **Method** | `GET` | `PUT` |
| **Request** | Query: `?status=pending` | `{ "storeId": "...", "status": "approved" }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy DS tất cả cửa hàng. | Phê duyệt/từ chối/vô hiệu hóa cửa hàng. |



### 7.3. API Quản lý Sản phẩm (API-048, 049, 050)

| | API-048: Lấy DS | API-049: Lấy Chi tiết | API-050: Cập nhật |
| :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/admin/products` | `/api/admin/products/[id]` | `/api/admin/products/[id]` |
| **Method** | `GET` | `GET` | `PUT` |
| **Request** | (Không có) | (Không có) | `{ "isActive": false }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 200 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy tất cả sản phẩm. | Lấy chi tiết 1 sản phẩm. | Cập nhật `isActive`. |



### 7.4. API Quản lý Đơn hàng (API-051, 052)

| | API-051: Lấy DS | API-052: Lấy Chi tiết |
| :--- | :--- | :--- |
| **Endpoint** | `/api/admin/orders` | `/api/admin/orders/[id]` |
| **Method** | `GET` | `GET` |
| **Request** | (Không có) | (Không có) |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy tất cả đơn hàng. | Lấy chi tiết 1 đơn hàng. |



### 7.5. API Quản lý Danh mục (API-053 à 056)

| | API-053: Lấy DS | API-054: Thêm | API-055: Sửa | API-056: Xóa |
| :--- | :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/admin/categories` | `/api/admin/categories` | `/api/admin/categories/[id]` | `/api/admin/categories/[id]` |
| **Method** | `GET` | `POST` | `PUT` | `DELETE` |
| **Request** | (Không có) | `{ "name": "...", ... }` | `{ "name": "...", ... }` | (Không có) |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 201 }` | `{ "data": {...}, "status": 200 }` | `{ "data": null, "status": 200 }` |
| **Xử lý** | Lấy tất cả danh mục. | Tạo danh mục. | Sửa danh mục. | Xóa danh mục. |



### 7.6. API Quản lý Thương hiệu (API-057 à 060)

| | API-057: Lấy DS | API-058: Thêm | API-059: Sửa | API-060: Xóa |
| :--- | :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/admin/brands` | `/api/admin/brands` | `/api/admin/brands/[id]` | `/api/admin/brands/[id]` |
| **Method** | `GET` | `POST` | `PUT` | `DELETE` |
| **Request** | (Không có) | `{ "name": "...", ... }` | `{ "name": "...", ... }` | (Không có) |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 201 }` | `{ "data": {...}, "status": 200 }` | `{ "data": null, "status": 200 }` |
| **Xử lý** | Lấy tất cả thương hiệu. | Tạo thương hiệu. | Sửa thương hiệu. | Xóa thương hiệu. |



### 7.7. API Quản lý Voucher (Platform/Shipping) (API-061, 062, 063)

| | API-061: Lấy DS | API-062: Thêm | API-063: Sửa |
| :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/admin/vouchers` | `/api/admin/vouchers` | `/api/admin/vouchers/[id]` |
| **Method** | `GET` | `POST` | `PUT` |
| **Request** | (Không có) | `{ "name": "...", ... }` | `{ "name": "...", ... }` |
| **Response** | `{ "data": [...], "status": 200 }` | `{ "data": {...}, "status": 201 }` | `{ "data": {...}, "status": 200 }` |
| **Xử lý** | Lấy DS voucher của Platform/Shipping. | Tạo voucher mới. | Sửa voucher. |



### 7.8. API Quản lý Coupon (Deprecated) (API-064)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/admin/coupons` |
| **Method** | `GET`, `POST`, `PUT`, `DELETE` |
| **Request** | - |
| **Response** | - |
| **Xử lý** | Quản lý hệ thống coupon cũ. **Lưu ý:** API này đã lỗi thời. |



### 7.9. API lấy thống kê Dashboard (API-065)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/admin/dashboard` |
| **Method** | `GET` |
| **Request** | (Không có) |
| **Response** | `{ "data": { "totalUsers": ..., "totalStores": ... }, "status": 200 }` |
| **Xử lý** | Tổng hợp các số liệu thống kê trên toàn hệ thống. |



---



## 8. Module Upload



| | API-066: Chung | API-067: Logo Cửa hàng | API-068: Logo Thương hiệu | API-069: Ảnh đại diện |
| :--- | :--- | :--- | :--- | :--- |
| **Endpoint** | `/api/upload` | `/api/upload-store` | `/api/upload/brand-logo` | `/api/upload/profile-image` |
| **Method** | `POST` | `POST` | `POST` | `POST` |
| **Request** | `FormData` chứa file | `FormData` chứa file | `FormData` chứa file | `FormData` chứa file |
| **Response** | `{ "data": { "url": "..." }, "status": 200 }` | `{ "data": { "url": "..." }, "status": 200 }` | `{ "data": { "url": "..." }, "status": 200 }` | `{ "data": { "url": "..." }, "status": 200 }` |
| **Xử lý** | Tải file lên dịch vụ lưu trữ (ImageKit) và trả về URL. | Tải logo cửa hàng. | Tải logo thương hiệu. | Tải ảnh đại diện. |



---



## 9. Module Hệ thống (System Webhooks)



### 9.1. API Webhook từ Stripe (API-070)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/stripe/webhook` |
| **Method** | `POST` |
| **Request** | (Payload do Stripe gửi) |
| **Response** | `200 OK` (cho Stripe) |
| **Xử lý** | Lắng nghe sự kiện `payment_intent.succeeded`. Khi nhận được, tiến hành tạo đơn hàng, trừ kho và cập nhật trạng thái voucher trong DB. |



### 9.2. API Webhook từ Inngest (API-071)

| | Nội dung |
| :--- | :--- |
| **Endpoint** | `/api/inngest` |
| **Method** | `POST` |
| **Request** | (Payload do Inngest gửi) |
| **Response** | `200 OK` (cho Inngest) |
| **Xử lý** | Endpoint để Inngest gọi và thực thi các tác vụ nền (background jobs) như gửi email. |
