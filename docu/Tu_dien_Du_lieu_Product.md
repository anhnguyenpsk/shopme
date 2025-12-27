### Từ điển Dữ liệu (Data Dictionary) - Bảng `Product`

| STT | Tên (Attribute)   | Ràng buộc (Constraint)     | Kiểu (Type)        | Ý nghĩa (Meaning)                                            |
| :-: | :---------------- | :------------------------- | :----------------- | :----------------------------------------------------------- |
|  1  | `id`              | Primary Key, Not Null      | `text`             | Định danh duy nhất cho sản phẩm.                             |
|  2  | `name`            | Not Null                   | `text`             | Tên của sản phẩm.                                            |
|  3  | `description`     | Not Null                   | `text`             | Mô tả chi tiết về sản phẩm.                                  |
|  5  | `price`           | Not Null                   | `double precision` | Giá bán thực tế.                                             |
|  6  | `images`          | Not Null                   | `text[]`           | Mảng các URL hình ảnh của sản phẩm.                          |
|  7  | `quantity`        | Not Null, Default: 0       | `integer`          | Số lượng tồn kho của sản phẩm.                               |
|  8  | `isActive`        | Not Null, Default: `true`  | `boolean`          | Cho biết sản phẩm có đang hoạt động/được hiển thị hay không. |
|  9  | `storeId`         | Foreign Key, Not Null      | `text`             | Khóa ngoại liên kết đến bảng `Store`.                        |
| 10  | `categoryId`      | Foreign Key, Nullable      | `text`             | Khóa ngoại liên kết đến bảng `Category`.                     |
| 11  | `brandId`         | Foreign Key, Nullable      | `text`             | Khóa ngoại liên kết đến bảng `Brand`.                        |
| 12  | `createdAt`       | Not Null, Default: `now()` | `timestamp(3)`     | Ngày tạo sản phẩm.                                           |
| 13  | `updatedAt`       | Not Null, Auto-updated     | `timestamp(3)`     | Ngày cập nhật sản phẩm lần cuối.                             |
| 14  | `hasVariations`   | Not Null, Default: `false` | `boolean`          | Đánh dấu sản phẩm có biến thể hay không.                     |
| 15  | `variationGroups` | Nullable                   | `jsonb`            | Lưu cấu hình nhóm biến thể (Size, Color...).                 |

**Quan hệ:**

- `Product` N-1 `Store` (Thuộc về một cửa hàng)
- `Product` N-1 `Category` (Thuộc danh mục)
- `Product` N-1 `Brand` (Thuộc thương hiệu)
- `Product` 1-N `OrderItem` (Có trong nhiều đơn hàng)
- `Product` 1-N `Rating` (Được nhiều người đánh giá)
- `Product` N-M `VoucherCampaign` (Một sản phẩm có thể thuộc về nhiều chiến dịch voucher)
- `Product` 1-N `ProductVariant` (Có nhiều biến thể)

---

### Từ điển Dữ liệu (Data Dictionary) - Bảng `ProductVariant`

| STT | Tên (Attribute) | Ràng buộc (Constraint)     | Kiểu (Type)        | Ý nghĩa (Meaning)                                              |
| :-: | :-------------- | :------------------------- | :----------------- | :------------------------------------------------------------- |
|  1  | `id`            | Primary Key, Not Null      | `text`             | Định danh duy nhất cho biến thể.                               |
|  2  | `productId`     | Foreign Key, Not Null      | `text`             | Khóa ngoại liên kết đến bảng `Product`.                        |
|  3  | `attributes`    | Not Null                   | `jsonb`            | Các thuộc tính biến thể (VD: `{"Color": "Red", "Size": "M"}`). |
|  4  | `price`         | Not Null                   | `double precision` | Giá bán của biến thể này.                                      |
|  5  | `quantity`      | Not Null, Default: 0       | `integer`          | Số lượng tồn kho của biến thể.                                 |
|  6  | `sku`           | Nullable                   | `text`             | Mã SKU quản lý kho.                                            |
|  7  | `images`        | Not Null                   | `text[]`           | (Optional) Hình ảnh riêng cho biến thể.                        |
|  8  | `createdAt`     | Not Null, Default: `now()` | `timestamp(3)`     | Ngày tạo biến thể.                                             |
|  9  | `updatedAt`     | Not Null, Auto-updated     | `timestamp(3)`     | Ngày cập nhật biến thể.                                        |

**Quan hệ:**

- `ProductVariant` N-1 `Product` (Thuộc về một sản phẩm)
- `ProductVariant` 1-N `OrderItem` (Có trong đơn hàng)
