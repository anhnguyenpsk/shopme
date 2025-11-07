# ShopMe - Tổng quan Tính năng Hệ thống

## 📋 Thông tin Dự án

**Tên dự án:** ShopMe - Multi-vendor E-commerce Platform  
**Công nghệ:** Next.js 15, React 19, Prisma, PostgreSQL, NextAuth.js, Stripe  
**Ngày cập nhật:** 5 tháng 11, 2025

---

## 🎯 Tổng quan Hệ thống

ShopMe là nền tảng thương mại điện tử đa nhà cung cấp (multi-vendor) cho phép:
- **Khách hàng:** Duyệt, mua sắm và đánh giá sản phẩm từ nhiều cửa hàng
- **Chủ cửa hàng:** Đăng ký, quản lý cửa hàng và sản phẩm của riêng họ
- **Admin:** Quản lý toàn bộ hệ thống, duyệt cửa hàng, quản lý người dùng và nội dung

---

## 👥 Hệ thống Phân quyền

### 1. Vai trò (Roles)
- **CUSTOMER** - Khách hàng mua sắm
- **STORE_OWNER** - Chủ cửa hàng
- **ADMIN** - Quản trị viên hệ thống

### 2. Quyền truy cập
Mỗi vai trò có quyền truy cập khác nhau vào các tính năng và API endpoints.

---

## 🔐 Xác thực & Bảo mật

### 1. NextAuth.js Authentication
- **Credential-based login:** Email + Password
- **Password hashing:** Bcrypt
- **Session strategy:** JWT (không dùng database session)
- **Email verification:** Mã xác thực 6 chữ số gửi qua email

### 2. Tính năng Xác thực
#### Đăng ký (Registration)
- Đăng ký tài khoản với email và password
- Xác thực email qua mã 6 chữ số
- Hệ thống gửi email tự động qua Nodemailer

#### Đăng nhập (Login)
- Đăng nhập bằng email/password
- Kiểm tra tài khoản có bị vô hiệu hóa không
- Tự động redirect theo vai trò

#### Quản lý Tài khoản
- Cập nhật thông tin cá nhân (tên, ảnh đại diện, phone, gender, ngày sinh)
- Đổi mật khẩu (có script reset password)
- Admin có thể vô hiệu hóa tài khoản người dùng

---

## 🛍️ Tính năng Khách hàng (CUSTOMER)

### 1. Duyệt & Tìm kiếm Sản phẩm
- **Trang chủ:** Hiển thị sản phẩm mới nhất, bán chạy nhất
- **Danh mục sản phẩm:** Lọc theo category và brand
- **Tìm kiếm:** Tìm kiếm sản phẩm theo từ khóa
- **Chi tiết sản phẩm:** 
  - Xem hình ảnh, mô tả, giá
  - Xem đánh giá và rating từ người mua khác
  - Kiểm tra số lượng tồn kho

### 2. Giỏ hàng (Cart)
- **Quản lý giỏ hàng:**
  - Thêm/xóa sản phẩm
  - Điều chỉnh số lượng
  - Chọn sản phẩm để thanh toán (cart selection)
  - Tự động đồng bộ giữa client và server
- **Xác thực tồn kho:**
  - Kiểm tra sản phẩm còn hàng không
  - Kiểm tra cửa hàng còn hoạt động không
  - Cảnh báo khi sản phẩm hết hàng hoặc không khả dụng
- **Tự động cập nhật:**
  - Xóa giỏ hàng khi logout (cart cleanup)
  - Sync cart khi login từ thiết bị khác

### 3. Địa chỉ giao hàng
- Thêm/sửa/xóa địa chỉ
- Chọn địa chỉ mặc định cho đơn hàng
- Thông tin: tên, số điện thoại, địa chỉ đầy đủ

### 4. Thanh toán & Đơn hàng
#### Phương thức thanh toán
- **COD (Cash on Delivery):** Thanh toán khi nhận hàng
- **Stripe:** Thanh toán online bằng thẻ

#### Quy trình đặt hàng
1. Chọn sản phẩm trong giỏ hàng
2. Chọn địa chỉ giao hàng
3. Áp dụng mã giảm giá (nếu có)
4. Chọn phương thức thanh toán
5. Xác nhận đơn hàng
6. Hệ thống tự động:
   - Tạo đơn hàng riêng cho mỗi cửa hàng
   - Trừ số lượng tồn kho (inventory deduction)
   - Gửi email xác nhận (qua Inngest)

#### Stripe Payment Integration
- Webhook xử lý thanh toán thành công/thất bại
- Tự động tạo đơn hàng khi thanh toán thành công
- Xử lý payment intent metadata

#### Quản lý Đơn hàng
- Xem lịch sử đơn hàng
- Theo dõi trạng thái: ORDER_PLACED → PROCESSING → SHIPPED → DELIVERED
- Xem chi tiết từng đơn hàng

### 5. Đánh giá & Rating
- Đánh giá sản phẩm đã mua (1-5 sao)
- Viết review chi tiết
- Chỉ có thể đánh giá sau khi đơn hàng DELIVERED
- Mỗi sản phẩm trong mỗi đơn hàng chỉ đánh giá 1 lần

### 6. Mã giảm giá (Coupons)
- Áp dụng mã giảm giá khi thanh toán
- Hệ thống hỗ trợ:
  - Mã công khai/riêng tư
  - Mã cho người dùng mới
  - Mã cho thành viên
  - Kiểm tra hạn sử dụng

---

## 🏪 Tính năng Chủ cửa hàng (STORE_OWNER)

### 1. Đăng ký Cửa hàng
- **Quy trình:**
  1. Khách hàng điền form đăng ký cửa hàng
  2. Upload logo cửa hàng
  3. Gửi đơn đăng ký → Status: PENDING
  4. Admin duyệt → Status: APPROVED
  5. Tự động chuyển role từ CUSTOMER → STORE_OWNER
- **Thông tin cửa hàng:**
  - Tên, username (unique, dùng trong URL)
  - Mô tả, địa chỉ
  - Email, số điện thoại liên hệ
  - Logo

### 2. Quản lý Cửa hàng
- **Cài đặt cửa hàng:**
  - Cập nhật thông tin cửa hàng
  - Thay đổi logo
  - Bật/tắt trạng thái hoạt động (isActive)
- **Dashboard:**
  - Thống kê doanh thu
  - Số đơn hàng
  - Biểu đồ theo thời gian

### 3. Quản lý Sản phẩm
- **Thêm sản phẩm mới:**
  - Tên, mô tả, giá
  - Upload nhiều hình ảnh
  - Chọn category và brand
  - Đặt số lượng tồn kho
- **Chỉnh sửa sản phẩm:**
  - Cập nhật thông tin
  - Thay đổi giá
  - Cập nhật số lượng tồn kho
- **Quản lý trạng thái:**
  - Bật/tắt sản phẩm (isActive)
  - Sản phẩm inactive không hiển thị cho khách hàng
- **Inventory Management:**
  - Theo dõi số lượng tồn kho real-time
  - Tự động trừ kho khi có đơn hàng
  - Cảnh báo hết hàng

### 4. Quản lý Đơn hàng
- **Xem đơn hàng:**
  - Danh sách tất cả đơn hàng của cửa hàng
  - Lọc theo trạng thái
- **Cập nhật trạng thái đơn hàng:**
  - ORDER_PLACED → PROCESSING
  - PROCESSING → SHIPPED
  - SHIPPED → DELIVERED
- **Xem chi tiết:**
  - Thông tin khách hàng
  - Địa chỉ giao hàng
  - Danh sách sản phẩm
  - Tổng giá trị đơn hàng

---

## 👨‍💼 Tính năng Admin (ADMIN)

### 1. Dashboard
- Tổng quan toàn hệ thống
- Thống kê người dùng, cửa hàng, sản phẩm, đơn hàng
- Biểu đồ doanh thu

### 2. Quản lý Người dùng
- **Xem danh sách người dùng:**
  - Lọc theo vai trò (CUSTOMER, STORE_OWNER, ADMIN)
  - Tìm kiếm theo email
- **Quản lý tài khoản:**
  - Vô hiệu hóa/kích hoạt tài khoản (isActive toggle)
  - Xem chi tiết thông tin người dùng
  - Xem lịch sử mua hàng của khách hàng

### 3. Quản lý Cửa hàng
- **Duyệt cửa hàng:**
  - Xem danh sách đơn đăng ký (PENDING)
  - Duyệt (APPROVED) hoặc từ chối (REJECTED)
- **Quản lý trạng thái:**
  - Vô hiệu hóa cửa hàng vi phạm (isActive = false)
  - Khi cửa hàng bị vô hiệu hóa:
    - Không thể nhận đơn hàng mới
    - Sản phẩm không hiển thị
    - Hiển thị thông báo "Store temporarily closed"
- **Xem thông tin:**
  - Chi tiết cửa hàng
  - Danh sách sản phẩm
  - Thống kê doanh thu

### 4. Quản lý Category (Danh mục)
- Thêm/sửa/xóa danh mục sản phẩm
- Tạo slug tự động cho URL
- Bật/tắt danh mục (isActive)

### 5. Quản lý Brand (Thương hiệu)
- Thêm/sửa/xóa thương hiệu
- Upload logo thương hiệu
- Thêm mô tả thương hiệu
- Bật/tắt thương hiệu (isActive)

### 6. Quản lý Sản phẩm
- Xem tất cả sản phẩm trong hệ thống
- Vô hiệu hóa sản phẩm vi phạm
- Xóa sản phẩm

### 7. Quản lý Đơn hàng
- Xem tất cả đơn hàng
- Theo dõi trạng thái đơn hàng
- Xem chi tiết đơn hàng

### 8. Quản lý Mã giảm giá (Coupons)
- **Tạo mã giảm giá:**
  - Mã code (unique)
  - Mức giảm giá (%)
  - Ngày hết hạn
  - Cấu hình: cho người mới, công khai/riêng tư
- **Chỉnh sửa/xóa mã:**
  - Cập nhật thông tin
  - Xóa mã hết hạn hoặc không còn dùng

---

## 🔧 Tính năng Kỹ thuật

### 1. Upload & Media Management
- **ImageKit Integration:**
  - Upload hình ảnh sản phẩm
  - Upload logo cửa hàng, thương hiệu
  - Tối ưu hóa và resize tự động
- **Local Storage:**
  - Lưu trữ tạm thời trong `/public/uploads`

### 2. Email System (Inngest)
- **Background Jobs:**
  - Gửi email xác thực tài khoản
  - Gửi email xác nhận đơn hàng
  - Xử lý bất đồng bộ để tăng performance
- **Email Templates:**
  - Email verification với mã 6 chữ số
  - Order confirmation

### 3. State Management
- **Redux Toolkit:**
  - Quản lý cart state
  - User state
  - UI state
- **Cart Sync Provider:**
  - Đồng bộ giỏ hàng giữa client và server
  - Real-time updates

### 4. Database
- **Prisma ORM:**
  - Type-safe database queries
  - Migration management
  - Seed data
- **PostgreSQL:**
  - Neon serverless PostgreSQL
  - Connection pooling

### 5. API Structure
- **REST API:**
  - `/api/auth/*` - Authentication
  - `/api/user/*` - User operations
  - `/api/store/*` - Store operations
  - `/api/admin/*` - Admin operations
  - `/api/products/*` - Product queries
  - `/api/orders/*` - Order management
  - `/api/stripe/*` - Payment integration

### 6. Security Features
- **Password hashing:** Bcrypt
- **JWT tokens:** Secure session management
- **Email verification:** 6-digit code với expiry
- **Rate limiting:** Prevent spam (planned)
- **Input validation:** Server-side validation
- **SQL injection prevention:** Prisma ORM
- **XSS protection:** React auto-escaping

---

## 📊 Database Schema

### Core Tables
- **User** - Người dùng (14 fields, includes isActive)
- **Store** - Cửa hàng (13 fields)
- **Product** - Sản phẩm (13 fields, includes quantity & isActive)
- **Category** - Danh mục (6 fields)
- **Brand** - Thương hiệu (8 fields, includes logo & description)
- **Order** - Đơn hàng (13 fields)
- **OrderItem** - Chi tiết đơn hàng (4 fields, composite PK)
- **Address** - Địa chỉ (9 fields)
- **Rating** - Đánh giá (8 fields)
- **Coupon** - Mã giảm giá (8 fields)
- **Account** - NextAuth accounts (12 fields)

### Key Relationships
- User 1:1 Store (one-to-one)
- Store 1:N Products
- Store 1:N Orders
- User 1:N Orders (as buyer)
- User 1:N Addresses
- User 1:N Ratings
- Product 1:N OrderItems
- Product 1:N Ratings
- Order 1:N OrderItems

---

## 🎨 Frontend Features

### 1. UI Components (Shadcn/ui)
- Button, Dialog, Select, Switch
- Label, Checkbox
- Responsive design
- Dark mode ready

### 2. Pages
- **Public:**
  - Homepage với hero, categories, products
  - Product listing & detail
  - Shop/Store pages
  - Cart & Checkout
- **User:**
  - Account management
  - Order history
  - Addresses
- **Store Owner:**
  - Dashboard
  - Product management
  - Order management
  - Settings
- **Admin:**
  - Dashboard
  - User management
  - Store approval
  - Content management

### 3. Features
- **Responsive design:** Mobile-first
- **Loading states:** Skeleton loaders
- **Toast notifications:** React Hot Toast
- **Form validation:** Client & server-side
- **Image galleries:** Product image viewer
- **Charts:** Recharts for analytics

---

## 🚀 Deployment & DevOps

### Environment Variables Required
```env
DATABASE_URL=          # PostgreSQL connection
DIRECT_URL=           # Direct database connection
NEXTAUTH_SECRET=      # NextAuth secret
NEXTAUTH_URL=         # Application URL
STRIPE_SECRET_KEY=    # Stripe secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe public
IMAGEKIT_*=           # ImageKit credentials
EMAIL_*=              # SMTP settings
INNGEST_*=            # Inngest configuration
```

### Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database

---

## 📈 Business Logic

### Order Creation Flow
1. User selects products in cart
2. Chooses delivery address
3. Applies coupon (optional)
4. Selects payment method (COD/Stripe)
5. System validates:
   - Stock availability
   - Store active status
   - Product active status
6. Groups items by store
7. Creates separate order for each store
8. Deducts inventory atomically (transaction)
9. Sends confirmation email

### Store Approval Flow
1. Customer registers store → PENDING
2. Admin reviews application
3. Admin approves → APPROVED
4. User role changes to STORE_OWNER
5. Store can start listing products

### Inventory Management
- Real-time stock tracking
- Atomic deduction on order creation
- Prevents overselling
- Low stock warnings
- Out of stock handling

---

## 🔄 Recent Updates & Features

### Implemented Features (2024-2025)
✅ User account active/inactive toggle  
✅ Product active/inactive toggle  
✅ Store active/inactive toggle  
✅ Inventory quantity management  
✅ Cart selection feature  
✅ Cart sync with authentication  
✅ Stock validation before checkout  
✅ Email verification system  
✅ Product rating system  
✅ Brand logo & description  
✅ Category slug-based filtering  
✅ COD payment status toggle  
✅ Stripe payment integration  
✅ Order quantity validation  
✅ Cart logout cleanup  

---

## 📝 Notes

- Hệ thống sử dụng **JWT session** thay vì database session
- **Multi-store orders:** Một giỏ hàng có thể tạo nhiều đơn hàng (mỗi store một đơn)
- **Email verification:** Sử dụng JWT token + 6-digit code, không lưu database
- **Stripe webhook:** Xử lý thanh toán bất đồng bộ

---

**Tài liệu này được cập nhật dựa trên codebase thực tế ngày 5/11/2025**



