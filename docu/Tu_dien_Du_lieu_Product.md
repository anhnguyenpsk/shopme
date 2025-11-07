### Từ điển Dữ liệu (Data Dictionary) - Bảng `Product`

| STT | Tên (Attribute) | Ràng buộc (Constraint) | Kiểu (Type) | Ý nghĩa (Meaning) |
|:---:|:---|:---|:---|:---|
| 1 | `id` | Primary Key, Not Null | `text` | Định danh duy nhất cho sản phẩm. |
| 2 | `name` | Not Null | `text` | Tên của sản phẩm. |
| 3 | `description` | Not Null | `text` | Mô tả chi tiết về sản phẩm. |
| 5 | `price` | Not Null | `double precision` | Giá bán thực tế. |
| 6 | `images` | Not Null | `text[]` | Mảng các URL hình ảnh của sản phẩm. |
| 7 | `quantity` | Not Null, Default: 0 | `integer` | Số lượng tồn kho của sản phẩm. |
| 8 | `isActive` | Not Null, Default: `true` | `boolean` | Cho biết sản phẩm có đang hoạt động/được hiển thị hay không. |
| 9 | `storeId` | Foreign Key, Not Null | `text` | Khóa ngoại liên kết đến bảng `Store`. |
| 10 | `categoryId` | Foreign Key, Nullable | `text` | Khóa ngoại liên kết đến bảng `Category`. |
| 11 | `brandId` | Foreign Key, Nullable | `text` | Khóa ngoại liên kết đến bảng `Brand`. |
| 12 | `createdAt` | Not Null, Default: `now()` | `timestamp(3)` | Ngày tạo sản phẩm. |
| 13 | `updatedAt` | Not Null, Auto-updated | `timestamp(3)` | Ngày cập nhật sản phẩm lần cuối. |
