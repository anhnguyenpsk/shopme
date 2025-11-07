@startuml

actor "Khách hàng" as User
boundary "Trang Đăng ký Cửa hàng (UI)" as UI
control "Next.js Server (API)" as Server
entity "Cơ sở dữ liệu (DB)" as DB


== Kiểm tra trạng thái và hiển thị form ==
User -> UI: 1. Truy cập trang /create-store
activate UI
UI -> Server: 2. GET /api/store/create (Kiểm tra đã đăng ký chưa)
activate Server
Server -> DB: 3. findFirst({ where: { userId } })
activate DB
DB --> Server: 4. null (Chưa có cửa hàng)
deactivate DB
Server --> UI: 5. { status: "not registered" }
deactivate Server
UI -> User: 6. Hiển thị form đăng ký
deactivate UI

== Điền form và gửi đơn ==
User -> UI: 7. Điền thông tin & chọn file logo
activate UI

' Luồng tải logo lên trước
UI -> Server: 8. POST /api/upload-store (file logo)
activate Server
Server -> Server: 9. Lưu file vào thư mục public/uploads
Server --> UI: 10. Trả về đường dẫn file logo
deactivate Server

User -> UI: 11. Nhấn "Gửi đơn"
UI -> Server: 12. POST /api/store/create (dữ liệu form + đường dẫn logo)
deactivate UI
activate Server

' Server xử lý đơn đăng ký
Server -> DB: 13. Kiểm tra username có tồn tại không
activate DB
DB --> Server: 14. null (Username hợp lệ)
deactivate DB

Server -> DB: 15. prisma.store.create({ status: "pending" })
activate DB
DB --> Server: 16. Xác nhận đã tạo cửa hàng
deactivate DB

Server -> DB: 17. prisma.user.update({ role: "STORE_OWNER" })
activate DB
DB --> Server: 18. Xác nhận đã cập nhật vai trò người dùng
deactivate DB

Server --> UI: 19. Phản hồi thành công
deactivate Server

activate UI
UI -> User: 20. Hiển thị thông báo "Đơn đã được gửi thành công"
deactivate UI

@enduml