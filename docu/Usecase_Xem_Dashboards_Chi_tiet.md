# Bảng Usecase Chi tiết: Xem Dashboard của Admin

| Tên mục | Nội dung |
| :--- | :--- |
| **Tên usecase** | Xem Dashboard của Admin |
| **Actor** | Quản trị viên (Admin) |
| **Mô tả** | Cho phép Admin xem trang tổng quan với các số liệu thống kê trên toàn hệ thống, bao gồm tổng doanh thu, tổng số đơn hàng, tổng số cửa hàng đang hoạt động, và biểu đồ thể hiện xu hướng đơn hàng. |
| **Điều kiện kích hoạt** | Admin đăng nhập thành công và được chuyển hướng tới trang Dashboard, hoặc chủ động điều hướng đến trang "Dashboard" từ sidebar của Admin. |
| **Tiền điều kiện** | Người dùng đã đăng nhập vào hệ thống với vai trò là "ADMIN". |
| **Hậu điều kiện** | **Thành công:**<br>- Hệ thống hiển thị trang Dashboard với các dữ liệu toàn hệ thống được cập nhật chính xác.<br><br>**Thất bại:**<br>- Admin nhận được thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng sự kiện chính** | 1. Admin truy cập vào trang Dashboard.<br>2. Hệ thống xác thực vai trò "ADMIN" của người dùng.<br>3. Hệ thống gọi API để lấy dữ liệu thống kê toàn hệ thống (tổng doanh thu, đơn hàng, cửa hàng...).<br>4. Hệ thống xử lý dữ liệu nhận về.<br>5. Hệ thống hiển thị dữ liệu lên giao diện dưới dạng các thẻ thông số và biểu đồ.<br>6. Usecase kết thúc. |
| **Luồng sự kiện phụ** | **3a. Lỗi khi tải dữ liệu:**<br>   1. Tại bước 3, API trả về lỗi do sự cố máy chủ hoặc mất kết nối.<br>   2. Hệ thống hiển thị một thông báo lỗi trên Dashboard (ví dụ: "Không thể tải dữ liệu thống kê, vui lòng thử lại sau"). |
| **Các yêu cầu đặc biệt** | - Dữ liệu phải được tổng hợp từ toàn bộ các hoạt động trên hệ thống.<br>- Các biểu đồ phải trực quan và dễ hiểu để Admin có thể nắm bắt nhanh tình hình. |

---

# Bảng Usecase Chi tiết: Xem Dashboard của Vendor

| Tên mục | Nội dung |
| :--- | :--- |
| **Tên usecase** | Xem Dashboard của Vendor |
| **Actor** | Chủ cửa hàng (Vendor) |
| **Mô tả** | Cho phép Vendor xem trang tổng quan với các số liệu thống kê của riêng cửa hàng mình, bao gồm tổng thu nhập, số đơn hàng, số sản phẩm, và danh sách các đánh giá gần đây. |
| **Điều kiện kích hoạt** | Vendor đăng nhập thành công và được chuyển hướng tới trang Dashboard, hoặc chủ động điều hướng đến trang "Dashboard" từ sidebar của trang quản lý cửa hàng. |
| **Tiền điều kiện** | 1. Người dùng đã đăng nhập vào hệ thống với vai trò là "STORE_OWNER".<br>2. Cửa hàng của người dùng đã ở trạng thái "Active" (được Admin phê duyệt). |
| **Hậu điều kiện** | **Thành công:**<br>- Hệ thống hiển thị trang Dashboard với các dữ liệu của riêng cửa hàng đó được cập nhật chính xác.<br><br>**Thất bại:**<br>- Vendor nhận được thông báo lỗi nếu không thể tải dữ liệu hoặc bị chuyển hướng nếu cửa hàng không hợp lệ. |
| **Luồng sự kiện chính** | 1. Vendor truy cập vào trang Dashboard.<br>2. Hệ thống xác thực vai trò "STORE_OWNER" và trạng thái "Active" của cửa hàng.<br>3. Hệ thống gọi API để lấy dữ liệu thống kê cho cửa hàng của Vendor đó.<br>4. Hệ thống xử lý dữ liệu nhận về.<br>5. Hệ thống hiển thị dữ liệu lên giao diện dưới dạng các thẻ thông số và danh sách (ví dụ: đánh giá gần đây).<br>6. Usecase kết thúc. |
| **Luồng sự kiện phụ** | **2a. Cửa hàng chưa được phê duyệt hoặc bị tạm ngưng:**<br>   1. Tại bước 2, hệ thống xác định cửa hàng của Vendor không ở trạng thái "Active".<br>   2. Hệ thống hiển thị một trang thông báo về trạng thái hiện tại của cửa hàng (ví dụ: "Cửa hàng của bạn đang chờ phê duyệt").<br><br>**3a. Lỗi khi tải dữ liệu:**<br>   1. Tại bước 3, API trả về lỗi.<br>   2. Hệ thống hiển thị một thông báo lỗi trên Dashboard. |
| **Các yêu cầu đặc biệt** | - Phải có sự phân quyền dữ liệu nghiêm ngặt, Vendor chỉ được phép xem dữ liệu của chính cửa hàng của mình, không thể xem dữ liệu của cửa hàng khác hay của toàn hệ thống. |
