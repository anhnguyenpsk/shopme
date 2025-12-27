# Kế hoạch Chi tiết - Phase 5: Triển khai Giao diện Voucher cho Khách hàng

## 1. Tóm tắt

**Mục tiêu:** Xây dựng và tích hợp giao diện người dùng (UI) mới cho phép khách hàng khám phá, "Sưu tầm" (Collect) và "Sử dụng" (Use) các voucher trong quá trình mua sắm. Giai đoạn này sẽ thay thế hoàn toàn luồng sử dụng coupon cũ và mang lại trải nghiệm người dùng liền mạch, hiện đại.

---

## 2. Các bước thực hiện chi tiết

### Bước 1: Xây dựng Giao diện "Sưu tầm" Voucher

**Mục tiêu:** Cho phép khách hàng thấy và lưu các voucher có thể sử dụng từ trang cửa hàng và trang sản phẩm.

- **File cần sửa đổi:** `app/(public)/shop/[username]/page.jsx`
  - **Nhiệm vụ:**
    1. Gọi API `GET /api/vouchers/public?storeId=[storeId]` để lấy danh sách các voucher công khai của cửa hàng.
    2. Hiển thị danh sách voucher này ở một vị trí nổi bật trên trang.
    3. Với mỗi voucher, thêm một nút "Lưu" hoặc "Sưu tầm".
    4. Khi người dùng nhấn nút "Lưu", gọi API `POST /api/user/vouchers` với `voucher_campaign_id` tương ứng.
    5. Hiển thị thông báo (toast) "Sưu tầm voucher thành công!" và có thể thay đổi trạng thái nút thành "Đã lưu".

- **File cần sửa đổi:** `app/(public)/product/[productId]/page.jsx`
  - **Nhiệm vụ:**
    1. Tương tự như trang cửa hàng, gọi API `GET /api/vouchers/public?productId=[productId]` để lấy các voucher áp dụng cho sản phẩm này.
    2. Hiển thị và cài đặt chức năng cho nút "Lưu" tương tự.

---

### Bước 2: Xây dựng Giao diện "Ví Voucher"

**Mục tiêu:** Tạo một nơi để người dùng quản lý tất cả các voucher họ đã sưu tầm.

- **File cần sửa đổi:** `app/(public)/account/page.jsx` (Hoặc một trang con như `app/(public)/account/vouchers/page.jsx`)
  - **Nhiệm vụ:**
    1. Thêm một tab mới có tên "Ví Voucher của tôi".
    2. Khi người dùng chọn tab này, gọi API `GET /api/user/vouchers` để lấy tất cả voucher của họ.
    3. Thiết kế giao diện hiển thị danh sách voucher, mỗi voucher là một `Card`.
    4. Triển khai các tab con để lọc voucher theo trạng thái: "Có sẵn" (`AVAILABLE`), "Đã sử dụng" (`USED`), "Hết hạn" (`EXPIRED`).
    5. Hiển thị đầy đủ thông tin của voucher: Mô tả, giá trị giảm, điều kiện, và ngày hết hạn.

---

### Bước 3: Tái cấu trúc Trang Thanh toán (Checkout)

**Mục tiêu:** Thay thế ô nhập mã coupon cũ bằng một luồng chọn voucher mới, trực quan hơn. Đây là bước quan trọng nhất.

- **File cần sửa đổi:** `components/OrderSummary.jsx`
  - **Nhiệm vụ:**
    1. **Xóa bỏ:** Loại bỏ hoàn toàn form và state liên quan đến `couponCodeInput` cũ.
    2. **Thêm State:**
       - `const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);`
       - `const [selectedVouchers, setSelectedVouchers] = useState({ SHOP: null, PLATFORM: null, SHIPPING: null });`
    3. **Thêm Nút:** Thêm một `<Button variant="outline">` với tiêu đề "Chọn hoặc nhập Voucher". Khi nhấn, nút này sẽ set `isVoucherModalOpen(true)`.
    4. **Cập nhật Logic tính toán:** Sửa lại hàm tính `payableTotal` để duyệt qua các voucher trong `selectedVouchers`, tính tổng số tiền được giảm và trừ vào tổng tiền.
    5. **Truyền dữ liệu:** Truyền danh sách các ID voucher đã chọn (`Object.values(selectedVouchers).filter(Boolean).map(v => v.id)`) xuống các component con như `StripePayment` hoặc hàm `finalizeOrder`.

---

### Bước 4: Tạo Component `VoucherSelectionModal`

**Mục tiêu:** Xây dựng một cửa sổ (modal) thông minh để người dùng chọn voucher phù hợp nhất.

- **File cần tạo:** `components/vouchers/VoucherSelectionModal.jsx`
  - **Nhiệm vụ:**
    1. Sử dụng component `<Dialog>` và `<DialogContent>` của shadcn/ui.
    2. Khi modal được mở (`useEffect` hoặc trigger), gọi API `POST /api/checkout/validate-vouchers` với `cartItems` lấy từ Redux store.
    3. **Hiển thị Voucher:**
       - API sẽ trả về danh sách các voucher hợp lệ đã được nhóm theo loại.
       - Hiển thị các voucher này trong modal theo từng nhóm rõ ràng: "Voucher của Shop", "Voucher từ ShopMe", "Voucher Vận chuyển".
    4. **Chức năng Chọn:**
       - Sử dụng `RadioGroup` hoặc các nút để cho phép người dùng chọn **một** voucher từ mỗi nhóm.
       - Hiển thị rõ lợi ích (số tiền được giảm) của từng voucher.
    5. **Chức năng Áp dụng:**
       - Khi người dùng nhấn nút "Áp dụng", modal sẽ đóng lại.
       - Gọi một hàm callback (được truyền từ `OrderSummary.jsx`) để cập nhật state `selectedVouchers` ở component cha.
