### Từ điển Dữ liệu (Data Dictionary) - Bảng `Category`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho danh mục. |
| 2 | `name` | Unique, Not Null | `text` | Tên của danh mục. |
| 3 | `slug` | Unique, Not Null | `text` | Chuỗi định danh duy nhất (dùng trong URL). |
| 4 | `isActive` | Not Null, Default: `true` | `boolean` | Cho biết danh mục có đang được sử dụng hay không. |
| 5 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo danh mục. |
| 6 | `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật danh mục lần cuối. |

---

### Từ điển Dữ liệu (Data Dictionary) - Bảng `Brand`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho thương hiệu. |
| 2 | `name` | Unique, Not Null | `text` | Tên của thương hiệu. |
| 3 | `slug` | Unique, Not Null | `text` | Chuỗi định danh duy nhất (dùng trong URL). |
| 4 | `logo` | Not Null | `text` | URL đến logo của thương hiệu. |
| 5 | `description` | Nullable | `text` | Mô tả chi tiết về thương hiệu. |
| 6 | `isActive` | Not Null, Default: `true` | `boolean` | Cho biết thương hiệu có đang được sử dụng hay không. |
| 7 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo thương hiệu. |
| 8 | `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật thương hiệu lần cuối. |
