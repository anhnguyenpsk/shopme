### Từ điển Dữ liệu (Data Dictionary) - Bảng `Store`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho cửa hàng. |
| 2 | `userId` | Foreign Key, Unique, Not Null | `text` | Khóa ngoại liên kết đến bảng `User` (chủ cửa hàng). |
| 3 | `name` | Not Null | `text` | Tên của cửa hàng. |
| 4 | `description` | Not Null | `text` | Mô tả chi tiết về cửa hàng. |
| 5 | `username` | Unique, Not Null | `text` | Tên định danh duy nhất của cửa hàng (dùng trong URL). |
| 6 | `address` | Not Null | `text` | Địa chỉ của cửa hàng. |
| 7 | `status` | Not Null, Default: 'pending' | `text` | Trạng thái duyệt của cửa hàng (pending, approved, rejected). |
| 8 | `isActive` | Not Null, Default: `false` | `boolean` | Cho biết cửa hàng có đang được phép hoạt động hay không. |
| 9 | `logo` | Not Null | `text` | URL đến logo của cửa hàng. |
| 10| `email` | Not Null | `text` | Email liên hệ của cửa hàng. |
| 11| `contact` | Not Null | `text` | Số điện thoại hoặc thông tin liên hệ khác. |
| 12| `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo cửa hàng. |
| 13| `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật thông tin lần cuối. |

**Quan hệ:**
- `Store` 1-N `VoucherCampaign` (Một cửa hàng có thể tạo ra nhiều chiến dịch voucher)
