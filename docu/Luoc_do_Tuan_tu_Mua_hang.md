'''plantuml
@startuml
!theme vibrant

actor "Khách hàng" as Customer
boundary "Giao diện Người dùng (UI)" as UI
entity "Redux Store" as Redux
control "Next.js Server (API)" as Server
entity "Cơ sở dữ liệu (DB)" as DB
boundary "Stripe API" as Stripe

title Lược đồ Tuần tự Chi tiết: Luồng Mua hàng (Đã cập nhật Quản lý Kho)

== Thêm sản phẩm và xem giỏ hàng ==
Customer -> UI: 1. Nhấn "Thêm vào giỏ"
activate UI
UI -> Redux: 2. dispatch(addToCart)
deactivate UI

Customer -> UI: 3. Điều hướng đến trang giỏ hàng (/cart)
activate UI
UI -> Redux: 4. useSelector(state.cart)
UI -> Server: 5. GET /api/addresses
deactivate UI
activate Server
Server -> DB: 6. Lấy danh sách địa chỉ
activate DB
DB --> Server: 7. Trả về danh sách địa chỉ
deactivate DB
Server --> UI: 8. Trả về danh sách địa chỉ
deactivate Server

== Hoàn tất thanh toán ==
alt Thanh toán qua Stripe

    Customer -> UI: 9a. Chọn địa chỉ & phương thức "Stripe"
    activate UI
    UI -> Server: 10. POST /api/stripe/create-payment-intent
    deactivate UI
    activate Server
    
    ' >>> START: Sửa đổi - Kiểm tra kho trước khi tạo thanh toán <<<
    Server -> DB: 10a. Kiểm tra số lượng tồn kho của các sản phẩm trong giỏ hàng
    activate DB
    
    alt Sản phẩm không đủ số lượng
        DB --> Server: 10b. Trả về lỗi (ví dụ: sản phẩm X hết hàng)
        deactivate DB
        Server --> UI: 10c. Phản hồi lỗi "Sản phẩm không đủ số lượng"
        deactivate Server
        activate UI
        UI -> Customer: 10d. Hiển thị thông báo lỗi
        deactivate UI
    else Sản phẩm còn đủ
        DB --> Server: 10b. Xác nhận còn hàng
        deactivate DB
        ' >>> END: Sửa đổi <<<
        
        Server -> Stripe: 11. Tạo PaymentIntent
        activate Stripe
        Stripe --> Server: 12. clientSecret
        deactivate Stripe
        Server --> UI: 13. clientSecret
        deactivate Server
        
        UI -> Customer: 14. Hiển thị form thanh toán Stripe
        Customer -> Stripe: 15. Nhập thông tin thẻ & xác nhận
        Stripe --> UI: 16. Phản hồi thanh toán thành công
        
        UI -> Customer: 17. Chuyển hướng đến trang /orders
        
        note right of Stripe
          **Luồng bất đồng bộ (Webhook)**
          Stripe sẽ gửi request đến server
          để xác nhận và tạo đơn hàng.
        end note
        
        Stripe -> Server: 18. Webhook: payment_intent.succeeded
        activate Server
        
        ' >>> START: Sửa đổi - Trừ kho và tạo đơn hàng trong transaction <<<
        Server -> DB: 19. Bắt đầu Transaction
        activate DB
        Server -> DB: 20. Cập nhật (trừ đi) số lượng tồn kho
        Server -> DB: 21. prisma.order.create({ isPaid: true })
        DB --> Server: 22. Xác nhận Transaction thành công
        deactivate DB
        ' >>> END: Sửa đổi <<<
        
        Server --> Stripe: 23. Phản hồi webhook (200 OK)
        deactivate Server
    end

else Thanh toán COD

    Customer -> UI: 9b. Chọn địa chỉ & phương thức "COD"
    Customer -> UI: 10. Nhấn "Đặt hàng"
    activate UI
    UI -> Server: 11. POST /api/orders
    deactivate UI
    activate Server
    
    ' >>> START: Sửa đổi - Kiểm tra kho, trừ kho và tạo đơn hàng trong transaction <<<
    Server -> DB: 12. Bắt đầu Transaction
    activate DB
    
    Server -> DB: 13. Kiểm tra số lượng tồn kho của các sản phẩm
    
    alt Sản phẩm không đủ số lượng
        DB --> Server: 14a. Trả về lỗi
        Server -> DB: 14b. Hủy bỏ Transaction
        deactivate DB
        Server --> UI: 14c. Phản hồi lỗi "Sản phẩm không đủ số lượng"
        deactivate Server
        activate UI
        UI -> Customer: 14d. Hiển thị thông báo lỗi
        deactivate UI
    else Sản phẩm còn đủ
        DB --> Server: 14. Xác nhận còn hàng
        Server -> DB: 15. Cập nhật (trừ đi) số lượng tồn kho
        Server -> DB: 16. prisma.order.create({ isPaid: false })
        DB --> Server: 17. Xác nhận Transaction thành công
        deactivate DB
        
        Server --> UI: 18. Thông báo thành công
        deactivate Server
        
        activate UI
        UI -> Redux: 19. dispatch(clearCart)
        UI -> Customer: 20. Chuyển hướng đến trang /orders
        deactivate UI
    end
    ' >>> END: Sửa đổi <<<
end

@enduml
'''