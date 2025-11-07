# Chi tiết Usecase: Quản lý Mã giảm giá

---

### 1. Bảng Usecase: Xem Danh sách Mã giảm giá

| Tên mục | Nội dung |
| :--- | :--- |
| **Tên usecase** | Xem Danh sách Mã giảm giá |
| **Actor** | Quản trị viên (Admin) |
| **Mô tả** | Cho phép Admin xem một danh sách tất cả các mã giảm giá hiện có trong hệ thống cùng các thông tin cơ bản và trạng thái của chúng. |
| **Điều kiện kích hoạt** | Admin truy cập vào mục "Coupons" từ thanh điều hướng (sidebar) trong trang quản trị. |
| **Tiền điều kiện** | Người dùng đã đăng nhập vào hệ thống với vai trò là "ADMIN". |
| **Hậu điều kiện** | **Thành công:** Hệ thống hiển thị một bảng danh sách các mã giảm giá.<br>**Thất bại:** Hệ thống hiển thị lỗi không thể tải dữ liệu. |
| **Luồng sự kiện chính** | 1. Admin truy cập trang "Quản lý Mã giảm giá".<br>2. Hệ thống gọi API để lấy danh sách tất cả các mã giảm giá.<br>3. Hệ thống hiển thị dữ liệu dưới dạng một bảng, bao gồm các cột như Mã, Mô tả, Mức giảm giá, Ngày hết hạn, Trạng thái.<br>4. Usecase kết thúc. |
| **Luồng sự kiện phụ** | **2a. Lỗi khi tải dữ liệu:**<br>   1. Tại bước 2, hệ thống không thể lấy dữ liệu từ API.<br>   2. Hệ thống hiển thị một thông báo lỗi, ví dụ: "Không thể tải danh sách mã giảm giá". |
| **Các yêu cầu đặc biệt** | Danh sách nên có chức năng phân trang nếu số lượng mã giảm giá quá lớn. |

---

### 2. Bảng Usecase: Tạo Mã giảm giá

| Tên mục | Nội dung |
| :--- | :--- |
| **Tên usecase** | Tạo Mã giảm giá |
| **Actor** | Quản trị viên (Admin) |
| **Mô tả** | Cho phép Admin tạo một mã giảm giá mới bằng cách cung cấp các thông tin cần thiết. |
| **Điều kiện kích hoạt** | Admin nhấn nút "Add Coupon" trên trang "Quản lý Mã giảm giá". |
| **Tiền điều kiện** | Admin đang ở trang "Quản lý Mã giảm giá". |
| **Hậu điều kiện** | **Thành công:** Một mã giảm giá mới được lưu vào cơ sở dữ liệu và hiển thị trong danh sách.<br>**Thất bại:** Mã giảm giá không được tạo, form tạo mới vẫn hiển thị kèm thông báo lỗi. |
| **Luồng sự kiện chính** | 1. Admin nhấn nút "Add Coupon".<br>2. Hệ thống hiển thị form tạo mới.<br>3. Admin điền các thông tin: Mã, Mô tả, Mức giảm giá, Ngày hết hạn, và các tùy chọn khác.<br>4. Admin nhấn nút "Create".<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu.<br>6. Hệ thống lưu mã giảm giá mới vào cơ sở dữ liệu.<br>7. Hệ thống đóng form, làm mới danh sách và hiển thị thông báo "Tạo thành công".<br>8. Usecase kết thúc. |
| **Luồng sự kiện phụ** | **5a. Dữ liệu không hợp lệ:**<br>   1. Tại bước 5, hệ thống phát hiện dữ liệu không hợp lệ (ví dụ: mã bị trùng).<br>   2. Hệ thống hiển thị thông báo lỗi chi tiết ngay trên form.<br>   3. Luồng sự kiện quay lại bước 3. |
| **Các yêu cầu đặc biệt** | Mã giảm giá phải là duy nhất. |

---

### 3. Bảng Usecase: Sửa Mã giảm giá

| Tên mục | Nội dung |
| :--- | :--- |
| **Tên usecase** | Sửa Mã giảm giá |
| **Actor** | Quản trị viên (Admin) |
| **Mô tả** | Cho phép Admin chỉnh sửa thông tin của một mã giảm giá đã tồn tại. |
| **Điều kiện kích hoạt** | Admin nhấn nút "Edit" của một mã giảm giá cụ thể trong danh sách. |
| **Tiền điều kiện** | Admin đang ở trang "Quản lý Mã giảm giá" và danh sách mã đã được hiển thị. |
| **Hậu điều kiện** | **Thành công:** Thông tin của mã giảm giá được cập nhật trong cơ sở dữ liệu.<br>**Thất bại:** Thông tin không thay đổi, form chỉnh sửa vẫn hiển thị kèm thông báo lỗi. |
| **Luồng sự kiện chính** | 1. Admin nhấn nút "Edit".<br>2. Hệ thống hiển thị form với thông tin hiện tại của mã giảm giá.<br>3. Admin thay đổi thông tin.<br>4. Admin nhấn nút "Update".<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>6. Hệ thống cập nhật thông tin vào cơ sở dữ liệu.<br>7. Hệ thống đóng form, làm mới danh sách và hiển thị thông báo "Cập nhật thành công".<br>8. Usecase kết thúc. |
| **Luồng sự kiện phụ** | **5a. Dữ liệu không hợp lệ:**<br>   1. Tại bước 5, hệ thống phát hiện dữ liệu không hợp lệ.<br>   2. Hệ thống hiển thị thông báo lỗi chi tiết.<br>   3. Luồng sự kiện quay lại bước 3. |
| **Các yêu cầu đặc biệt** | Không được phép sửa "Mã giảm giá" (code) vì nó là khóa chính. |

---

### 4. Bảng Usecase: Xóa Mã giảm giá

| Tên mục | Nội dung |
| :--- | :--- |
| **Tên usecase** | Xóa Mã giảm giá |
| **Actor** | Quản trị viên (Admin) |
| **Mô tả** | Cho phép Admin xóa một mã giảm giá khỏi hệ thống. |
| **Điều kiện kích hoạt** | Admin nhấn nút "Delete" của một mã giảm giá cụ thể trong danh sách. |
| **Tiền điều kiện** | Admin đang ở trang "Quản lý Mã giảm giá". |
| **Hậu điều kiện** | **Thành công:** Mã giảm giá bị xóa khỏi cơ sở dữ liệu và biến mất khỏi danh sách.<br>**Thất bại:** Mã giảm giá không bị xóa và hệ thống hiển thị thông báo lỗi. |
| **Luồng sự kiện chính** | 1. Admin nhấn nút "Delete".<br>2. Hệ thống hiển thị hộp thoại yêu cầu xác nhận.<br>3. Admin xác nhận.<br>4. Hệ thống kiểm tra ràng buộc dữ liệu (ví dụ: kiểm tra xem mã đã được sử dụng trong đơn hàng nào chưa).<br>5. Hệ thống xóa mã giảm giá khỏi cơ sở dữ liệu.<br>6. Hệ thống làm mới danh sách và hiển thị thông báo "Xóa thành công".<br>7. Usecase kết thúc. |
| **Luồng sự kiện phụ** | **3a. Hủy bỏ việc xóa:**<br>   1. Tại bước 3, Admin chọn "Cancel".<br>   2. Hệ thống đóng hộp thoại và không thực hiện hành động xóa.<br>   3. Usecase kết thúc.<br><br>**4a. Tồn tại ràng buộc dữ liệu:**<br>   1. Tại bước 4, hệ thống phát hiện mã giảm giá đã được sử dụng.<br>   2. Hệ thống không thực hiện việc xóa và hiển thị thông báo lỗi, ví dụ: "Không thể xóa mã giảm giá đã được sử dụng."<br>   3. Usecase kết thúc. |
| **Các yêu cầu đặc biệt** | Để bảo toàn dữ liệu lịch sử, hệ thống không nên cho phép xóa mã giảm giá đã được sử dụng. Thay vào đó, nên có chức năng "Vô hiệu hóa". |
