@startuml

actor "Admin"
boundary "Trang Phê duyệt (UI)" as UI
control "Next.js Server (API)" as Server
entity "Cơ sở dữ liệu (DB)" as DB
boundary "Inngest (Dịch vụ nền)" as Inngest


== Tải danh sách cửa hàng chờ duyệt ==
Admin -> UI: 1. Truy cập trang /admin/approve
activate UI
UI -> Server: 2. GET /api/admin/stores?status=pending
activate Server
Server -> DB: 3. Lấy danh sách cửa hàng có status="pending"
activate DB
DB --> Server: 4. Trả về danh sách cửa hàng
deactivate DB
Server --> UI: 5. Dữ liệu cửa hàng
deactivate Server
UI -> Admin: 6. Hiển thị danh sách cửa hàng chờ duyệt
deactivate UI

== Phê duyệt một cửa hàng ==
Admin -> UI: 7. Nhấn nút "Phê duyệt"
activate UI
UI -> Server: 8. PUT /api/admin/stores (body: { storeId, status: 'approved' })
deactivate UI
activate Server

' Server cập nhật trạng thái cửa hàng và vai trò người dùng
Server -> DB: 9. store.update({ status: 'approved' })
activate DB
DB --> Server: 10. Xác nhận cập nhật cửa hàng
deactivate DB

Server -> DB: 11. user.update({ role: 'STORE_OWNER' })
activate DB
DB --> Server: 12. Xác nhận cập nhật người dùng
deactivate DB

' Kích hoạt job gửi email thông báo
Server -> Inngest: 13. inngest.send(STORE_STATUS_UPDATED)
activate Inngest
note over Inngest: Xử lý bất đồng bộ để gửi email...
deactivate Inngest

Server --> UI: 14. Phản hồi phê duyệt thành công
deactivate Server

activate UI
UI -> Admin: 15. Hiển thị thông báo "Phê duyệt thành công"
deactivate UI

@enduml