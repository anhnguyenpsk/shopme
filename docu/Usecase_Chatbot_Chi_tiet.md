# Bảng Chi Tiết Use Case - AI Chatbot System

Tài liệu này mô tả chi tiết các Use Case cho hệ thống AI Chatbot của ShopMe, dựa trên thiết kế từ `Chatbot_Design.md`, `AI_Chatbot_Workflow.md` và `ERD_Project.md`.

## 1. Actor (Tác nhân)

| Actor                 | Mô tả                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| **User (Customer)**   | Người dùng cuối (đã đăng nhập hoặc khách vãng lai) tương tác với Chatbot. |
| **System (AI Agent)** | Hệ thống backend tích hợp Google Gemini AI và Database.                   |

## 2. Danh sách Use Case

| ID        | Tên Use Case                                   | Mức độ ưu tiên | Trạng thái |
| --------- | ---------------------------------------------- | -------------- | ---------- |
| UC_BOT_01 | Khởi tạo phiên Chat (Init Session)             | Cao            | Ready      |
| UC_BOT_02 | Gửi tin nhắn & Nhận phản hồi (Chat Loop)       | Cao            | Ready      |
| UC_BOT_03 | Tìm kiếm/Tư vấn sản phẩm (Product Search)      | Cao            | Ready      |
| UC_BOT_04 | Tra cứu khuyến mãi (Promo Check)               | Trung bình     | Ready      |
| UC_BOT_05 | Hỏi đáp chung (General FAQ)                    | Thấp           | Ready      |
| UC_BOT_06 | Xem lịch sử hội thoại (View History)           | Trung bình     | Ready      |
| UC_BOT_07 | Đánh giá phản hồi (Feedback)                   | Thấp           | Planned    |
| UC_BOT_08 | Theo dõi tương tác sản phẩm (Product tracking) | Thấp           | Planned    |

## 3. Chi tiết Use Case

### UC_BOT_01: Khởi tạo phiên Chat

| Mục                      | Nội dung                                                                                                                                                                                                                                                              |
| :----------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Khởi tạo phiên Chat (Init Session)                                                                                                                                                                                                                                    |
| **Actor**                | User, System                                                                                                                                                                                                                                                          |
| **Mô tả**                | Hệ thống tạo hoặc tải lại phiên làm việc (Session) khi người dùng mở cửa sổ chat.                                                                                                                                                                                     |
| **Điều kiện kích hoạt**  | Người dùng click vào icon Chat Widget hoặc truy cập trang Chat.                                                                                                                                                                                                       |
| **Tiền điều kiện**       | Không có.                                                                                                                                                                                                                                                             |
| **Hậu điều kiện**        | Một phiên chat (`Conversation`) được thiết lập và sẵn sàng nhận tin nhắn.                                                                                                                                                                                             |
| **Luồng sự kiện chính**  | 1. User mở cửa sổ chat.<br>2. Client gửi request kiểm tra session hiện tại.<br>3. **System** kiểm tra trong Database:<br> - Nếu tìm thấy: Tải lịch sử.<br> - Nếu không: Tạo bản ghi `Conversation` mới.<br>4. System trả về `sessionId`.<br>5. UI hiển thị giao diện. |
| **Luồng sự kiện phụ**    | - **UC_BOT_01** --`<<include>>`--> **UC_BOT_06** : Hệ thống tự động tải lịch sử chat (nếu có).                                                                                                                                                                        |
| **Các yêu cầu đặc biệt** | - Thời gian phản hồi < 500ms.<br>- Hỗ trợ reconnection.                                                                                                                                                                                                               |

---

### UC_BOT_02: Gửi tin nhắn & Nhận phản hồi (Chat Loop)

| Mục                      | Nội dung                                                                                                                                                                                                                                                                                                                                                                                    |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tên usecase**          | Gửi tin nhắn & Nhận phản hồi                                                                                                                                                                                                                                                                                                                                                                |
| **Actor**                | User, System, AI Agent                                                                                                                                                                                                                                                                                                                                                                      |
| **Mô tả**                | Luồng tương tác chính: User gửi text, AI phân tích và trả lời.                                                                                                                                                                                                                                                                                                                              |
| **Điều kiện kích hoạt**  | User nhập nội dung và nhấn nút Gửi (Send).                                                                                                                                                                                                                                                                                                                                                  |
| **Tiền điều kiện**       | Đã có Session active (UC_BOT_01).                                                                                                                                                                                                                                                                                                                                                           |
| **Hậu điều kiện**        | Tin nhắn User và Bot được lưu vào DB.                                                                                                                                                                                                                                                                                                                                                       |
| **Luồng sự kiện chính**  | 1. User nhập tin nhắn và gửi.<br>2. Client gửi tin nhắn đến Server API.<br>3. **System** lưu tin nhắn User vào bảng `Message`.<br>4. **System** gọi AI Agent phân tích Intent.<br>5. AI sinh câu trả lời (Response).<br>6. **System** lưu tin nhắn phản hồi của AI vào bảng `Message`.<br>7. System trả về câu phản hồi cho Client.<br>8. UI hiển thị câu trả lời của Bot.                  |
| **Luồng sự kiện phụ**    | - **UC_BOT_03** --`<<extend>>`--> **UC_BOT_02** : Khi AI phát hiện intent là `SEARCH_PRODUCTS`.<br>- **UC_BOT_04** --`<<extend>>`--> **UC_BOT_02** : Khi AI phát hiện intent là `CHECK_PROMOTIONS`.<br>- **UC_BOT_05** --`<<extend>>`--> **UC_BOT_02** : Khi AI phát hiện intent là `GENERAL_CHAT`.<br>- **UC_BOT_07** --`<<extend>>`--> **UC_BOT_02** : Khi người dùng thực hiện đánh giá. |
| **Các yêu cầu đặc biệt** | - Hiển thị trạng thái "Bot is typing" khi chờ phản hồi.                                                                                                                                                                                                                                                                                                                                     |

---

### UC_BOT_03: Tìm kiếm & Tư vấn sản phẩm

| Mục                      | Nội dung                                                                                                                                                                                                                                                                                                                                       |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Tìm kiếm & Tư vấn sản phẩm                                                                                                                                                                                                                                                                                                                     |
| **Actor**                | User, System, AI Agent                                                                                                                                                                                                                                                                                                                         |
| **Mô tả**                | AI tìm kiếm sản phẩm dựa trên nhu cầu của User (Semantic Search).                                                                                                                                                                                                                                                                              |
| **Điều kiện kích hoạt**  | User gửi tin nhắn chứa ý định mua hàng.                                                                                                                                                                                                                                                                                                        |
| **Tiền điều kiện**       | Session active.                                                                                                                                                                                                                                                                                                                                |
| **Hậu điều kiện**        | User nhận được gợi ý sản phẩm. Dữ liệu tham chiếu sản phẩm được lưu.                                                                                                                                                                                                                                                                           |
| **Luồng sự kiện chính**  | 1. User gửi tin nhắn.<br>2. **System** xác định Intent `SEARCH_PRODUCTS`.<br>3. AI trích xuất tham số tìm kiếm.<br>4. **System** thực hiện Vector Search.<br>5. Database trả về danh sách sản phẩm.<br>6. AI format câu trả lời.<br>7. **System** lưu tham chiếu vào `MessageProductReference`.<br>8. System trả về câu trả lời kèm danh sách. |
| **Luồng sự kiện phụ**    | - **UC_BOT_03** --`<<extend>>`--> **UC_BOT_02** : Mở rộng luồng chat khi cần tìm kiếm sản phẩm.<br>- **UC_BOT_08** --`<<extend>>`--> **UC_BOT_03** : Xảy ra khi click sản phẩm.                                                                                                                                                                |
| **Các yêu cầu đặc biệt** | - Hỗ trợ tìm kiếm theo ngữ nghĩa (Vector Search).                                                                                                                                                                                                                                                                                              |

---

### UC_BOT_04: Tra cứu khuyến mãi

| Mục                      | Nội dung                                                                                                                                                                                                           |
| :----------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Tra cứu khuyến mãi                                                                                                                                                                                                 |
| **Actor**                | User, System                                                                                                                                                                                                       |
| **Mô tả**                | User hỏi về các mã giảm giá hoặc chương trình khuyến mãi.                                                                                                                                                          |
| **Điều kiện kích hoạt**  | User hỏi về ưu đãi/voucher.                                                                                                                                                                                        |
| **Tiền điều kiện**       | Session active.                                                                                                                                                                                                    |
| **Hậu điều kiện**        | User biết được các khuyến mãi hiện có.                                                                                                                                                                             |
| **Luồng sự kiện chính**  | 1. User gửi tin nhắn.<br>2. **System** xác định Intent `CHECK_PROMOTIONS`.<br>3. **System** query bảng `VoucherCampaign`.<br>4. AI tổng hợp thông tin.<br>5. System trả về câu trả lời.<br>6. UI hiển thị voucher. |
| **Luồng sự kiện phụ**    | - **UC_BOT_04** --`<<extend>>`--> **UC_BOT_02** : Mở rộng luồng chat khi cần tra cứu voucher.                                                                                                                      |
| **Các yêu cầu đặc biệt** | - Chỉ hiển thị voucher Active và còn hạn.                                                                                                                                                                          |

---

### UC_BOT_05: Hỏi đáp chung (General Chat)

| Mục                      | Nội dung                                                                                                                                           |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Hỏi đáp chung                                                                                                                                      |
| **Actor**                | User, System                                                                                                                                       |
| **Mô tả**                | Xử lý các câu hỏi thông thường, chính sách, v.v.                                                                                                   |
| **Điều kiện kích hoạt**  | User hỏi câu không liên quan sản phẩm cụ thể.                                                                                                      |
| **Tiền điều kiện**       | Session active.                                                                                                                                    |
| **Hậu điều kiện**        | User nhận được thông tin giải đáp.                                                                                                                 |
| **Luồng sự kiện chính**  | 1. User gửi tin nhắn.<br>2. **System** xác định Intent `GENERAL_CHAT`.<br>3. AI dùng Knowledge Base trả lời.<br>4. System trả về câu trả lời text. |
| **Luồng sự kiện phụ**    | - **UC_BOT_05** --`<<extend>>`--> **UC_BOT_02** : Mở rộng luồng chat khi xử lý FAQ.                                                                |
| **Các yêu cầu đặc biệt** | - Giọng điệu thân thiện.                                                                                                                           |

---

### UC_BOT_06: Xem lịch sử hội thoại

| Mục                      | Nội dung                                                                                                                                 |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Xem lịch sử hội thoại                                                                                                                    |
| **Actor**                | User, System                                                                                                                             |
| **Mô tả**                | User xem lại các tin nhắn cũ trong phiên chat.                                                                                           |
| **Điều kiện kích hoạt**  | User mở lại cửa sổ chat.                                                                                                                 |
| **Tiền điều kiện**       | User đã có Session trước đó.                                                                                                             |
| **Hậu điều kiện**        | Hiển thị toàn bộ nội dung chat cũ.                                                                                                       |
| **Luồng sự kiện chính**  | 1. Client gọi API `getChatHistory`.<br>2. **System** query bảng `Message`.<br>3. System trả về mảng tin nhắn.<br>4. UI render hội thoại. |
| **Luồng sự kiện phụ**    | - **UC_BOT_01** --`<<include>>`--> **UC_BOT_06** : Được gọi khi khởi tạo session.                                                        |
| **Các yêu cầu đặc biệt** | - Sắp xếp tin nhắn theo thời gian tăng dần.                                                                                              |

---

### UC_BOT_07: Đánh giá phản hồi

| Mục                      | Nội dung                                                                                                                         |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Đánh giá phản hồi (User Feedback)                                                                                                |
| **Actor**                | User                                                                                                                             |
| **Mô tả**                | User đánh giá chất lượng câu trả lời của Bot.                                                                                    |
| **Điều kiện kích hoạt**  | User click nút Like hoặc Dislike.                                                                                                |
| **Tiền điều kiện**       | Bot vừa trả lời tin nhắn.                                                                                                        |
| **Hậu điều kiện**        | Dữ liệu phản hồi được ghi nhận.                                                                                                  |
| **Luồng sự kiện chính**  | 1. User thực hiện đánh giá trên UI.<br>2. Client gửi request cập nhật `feedbackScore`.<br>3. **System** cập nhật bảng `Message`. |
| **Luồng sự kiện phụ**    | - **UC_BOT_07** --`<<extend>>`--> **UC_BOT_02** : Mở rộng từ tin nhắn phản hồi.                                                  |
| **Các yêu cầu đặc biệt** | - Không có.                                                                                                                      |

---

### UC_BOT_08: Tương tác với sản phẩm gợi ý

| Mục                      | Nội dung                                                                                                                                                                   |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tên usecase**          | Tương tác với sản phẩm gợi ý                                                                                                                                               |
| **Actor**                | User                                                                                                                                                                       |
| **Mô tả**                | Theo dõi hành vi User khi click vào sản phẩm Bot gợi ý.                                                                                                                    |
| **Điều kiện kích hoạt**  | User click vào Link/Card sản phẩm.                                                                                                                                         |
| **Tiền điều kiện**       | Tin nhắn Bot có chứa Product Card.                                                                                                                                         |
| **Hậu điều kiện**        | Hệ thống ghi nhận được độ hiệu quả (CTR).                                                                                                                                  |
| **Luồng sự kiện chính**  | 1. User click vào sản phẩm.<br>2. Client gửi sự kiện tracking về Server.<br>3. **System** cập nhật `wasClicked = true`.<br>4. Client chuyển hướng User đến trang chi tiết. |
| **Luồng sự kiện phụ**    | - **UC_BOT_08** --`<<extend>>`--> **UC_BOT_03** : Mở rộng từ kết quả tìm kiếm.                                                                                             |
| **Các yêu cầu đặc biệt** | - Tracking không ảnh hưởng tốc độ chuyển trang.                                                                                                                            |

## 4. Ma trận Quyền truy cập (Access Matrix)

| Use Case           | Guest (Khách)                         | Logged-in User (Customer)              |
| ------------------ | ------------------------------------- | -------------------------------------- |
| Khởi tạo Chat      | ✅ (Session ẩn danh)                  | ✅ (Session gắn với UserID)            |
| Tìm kiếm sản phẩm  | ✅                                    | ✅                                     |
| Tra cứu khuyến mãi | ✅ (Voucher công khai)                | ✅ (Có thể kèm Voucher riêng - Future) |
| Xem lịch sử chat   | ⚠️ (Chỉ trong phiên browser hiện tại) | ✅ (Đồng bộ qua các thiết bị)          |
| Đánh giá/Click     | ✅                                    | ✅                                     |
