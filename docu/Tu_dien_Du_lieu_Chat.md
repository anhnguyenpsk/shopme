### Từ điển Dữ liệu (Data Dictionary) - Hệ thống Chat (Chat System)

#### 1. Bảng `ChatSession` (Phiên trò chuyện)

| STT | Tên (Attribute) | Ràng buộc (Constraint)     | Kiểu (Type)    | Ý nghĩa (Meaning)                                                                               |
| :-: | :-------------- | :------------------------- | :------------- | :---------------------------------------------------------------------------------------------- |
|  1  | `id`            | Primary Key, Not Null      | `text`         | Định danh duy nhất cho phiên chat.                                                              |
|  2  | `title`         | Not Null                   | `text`         | Tiêu đề của phiên chat (thường là tóm tắt nội dung đầu).                                        |
|  3  | `userId`        | Foreign Key, Nullable      | `text`         | Khóa ngoại liên kết đến người dùng (bảng `User`). Có thể null nếu chat ẩn danh (tùy nghiệp vụ). |
|  4  | `createdAt`     | Not Null, Default: `now()` | `timestamp(3)` | Thời điểm bắt đầu phiên chat.                                                                   |
|  5  | `updatedAt`     | Not Null, Auto-updated     | `timestamp(3)` | Thời điểm cập nhật cuối cùng.                                                                   |

**Quan hệ:**

- `ChatSession` 1-N `ChatMessage`
- `ChatSession` N-1 `User`

#### 2. Bảng `ChatMessage` (Tin nhắn)

| STT | Tên (Attribute) | Ràng buộc (Constraint)     | Kiểu (Type)    | Ý nghĩa (Meaning)                                    |
| :-: | :-------------- | :------------------------- | :------------- | :--------------------------------------------------- |
|  1  | `id`            | Primary Key, Not Null      | `text`         | Định danh duy nhất cho tin nhắn.                     |
|  2  | `content`       | Not Null                   | `text`         | Nội dung tin nhắn.                                   |
|  3  | `role`          | Not Null                   | `text`         | Vai trò người gửi (`user` hoặc `model`/`assistant`). |
|  4  | `chatSessionId` | Foreign Key, Not Null      | `text`         | Khóa ngoại liên kết đến phiên chat (`ChatSession`).  |
|  5  | `createdAt`     | Not Null, Default: `now()` | `timestamp(3)` | Thời điểm gửi tin nhắn.                              |

**Quan hệ:**

- `ChatMessage` N-1 `ChatSession`

#### 3. Bảng `ChatLogs` (Nhật ký Chat AI)

| STT | Tên (Attribute)  | Ràng buộc (Constraint)     | Kiểu (Type)    | Ý nghĩa (Meaning)                                 |
| :-: | :--------------- | :------------------------- | :------------- | :------------------------------------------------ |
|  1  | `id`             | Primary Key, Not Null      | `text`         | Định danh log.                                    |
|  2  | `sessionId`      | Not Null, Foreign Key      | `text`         | ID phiên chat liên quan (FK -> ChatSession.id).   |
|  3  | `userQuery`      | Not Null                   | `text`         | Câu hỏi/yêu cầu gốc của người dùng.               |
|  4  | `detectedIntent` | Nullable                   | `text`         | Ý định được AI phát hiện (VD: tim_kiem_san_pham). |
|  5  | `toolUsed`       | Nullable                   | `text`         | Công cụ (tool) mà AI đã gọi.                      |
|  6  | `toolInput`      | Nullable                   | `jsonb`        | Tham số đầu vào gửi cho tool.                     |
|  7  | `toolOutput`     | Nullable                   | `jsonb`        | Kết quả trả về từ tool.                           |
|  8  | `finalResponse`  | Not Null                   | `text`         | Câu trả lời cuối cùng AI gửi cho user.            |
|  9  | `responseTime`   | Nullable                   | `integer`      | Thời gian xử lý (ms).                             |
| 10  | `errorMessage`   | Nullable                   | `text`         | Thông báo lỗi nếu có.                             |
| 11  | `userId`         | Nullable                   | `text`         | ID người dùng (nếu có).                           |
| 12  | `createdAt`      | Not Null, Default: `now()` | `timestamp(3)` | Thời điểm ghi log.                                |
