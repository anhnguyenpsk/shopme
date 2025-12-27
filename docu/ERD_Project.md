```plantuml
@startuml
!theme vibrant

' hide the spot
hide circle

' avoid problems with angled crows feet
skinparam linetype ortho

title Lược đồ Quan hệ Thực thể (ERD) - ShopMe (Voucher System Update)

' --- Enums Definition ---
enum "VoucherType" {
  SHOP
  PLATFORM
  SHIPPING
}

enum "DiscountType" {
  FIXED_AMOUNT
  PERCENTAGE
}

enum "UserVoucherStatus" {
  AVAILABLE
  USED
  EXPIRED
}

' --- Entities Definition ---

entity "User" {
  * **id** : String <<PK>>
  --
  name : String
  email : String <<unique>>
  role : Role
  isActive: Boolean
  ' ... other fields
}

entity "Store" {
  * **id** : String <<PK>>
  --
  *<u>userId</u>* : String <<FK>>
  name : String
  username : String <<unique>>
  status : String
  ' ... other fields
}

entity "Product" {
  * **id** : String <<PK>>
  --
  name : String
  price : Float
  quantity : Int
  *<u>storeId</u>* : String <<FK>>
  *<u>categoryId</u>* : String <<FK>>
  *<u>brandId</u>* : String <<FK>>
  hasVariations : Boolean
  variationGroups: Json
  ' ... other fields
}

entity "ProductVariant" {
  * **id** : String <<PK>>
  * **<u>productId</u>** : String <<FK>>
  --
  attributes : Json
  price : Float
  quantity : Int
  sku: String
  images: String[]
}

entity "Category" {
  * **id** : String <<PK>>
  --
  name : String <<unique>>
  slug : String <<unique>>
  *<u>parentId</u>* : String <<FK>>
}

entity "Brand" {
  * **id** : String <<PK>>
  --
  name : String <<unique>>
  slug : String <<unique>>
  logo: String
}

entity "Order" {
  * **id** : String <<PK>>
  --
  total : Float
  totalDiscountAmount: Float
  status : OrderStatus
  *<u>userId</u>* : String <<FK>>
  *<u>storeId</u>* : String <<FK>>
  *<u>addressId</u>* : String <<FK>>
  deliveredAt : DateTime
  completedAt : DateTime
  ' ... other fields
}

entity "OrderItem" {
  * **<u>orderId</u>** : String <<PK, FK>>
  * **<u>productId</u>** : String <<PK, FK>>
  --
  quantity : Int
  price : Float
  *<u>variantId</u>* : String <<FK>>
}

entity "Address" {
  * **id** : String <<PK>>
  --
  *<u>userId</u>* : String <<FK>>
  street : String
  city : String
  ' ... other fields
}

entity "Rating" {
  * **id** : String <<PK>>
  --
  rating : Int
  review : String
  *<u>userId</u>* : String <<FK>>
  *<u>productId</u>* : String <<FK>>
}

' --- New Voucher Entities ---
entity "VoucherCampaign" {
  * **id** : String <<PK>>
  --
  voucher_code : String <<unique>>
  voucher_type : VoucherType
  discount_type : DiscountType
  discount_value : Float
  max_discount_amount : Float
  min_order_value : Float
  start_date : DateTime
  end_date : DateTime
  *<u>created_by_shop_id</u>* : String <<FK>>
}

entity "UserVoucher" {
  * **id** : String <<PK>>
  --
  status : UserVoucherStatus
  *<u>user_id</u>* : String <<FK>>
  *<u>voucher_campaign_id</u>* : String <<FK>>
  *<u>used_in_order_id</u>* : String <<FK>>
}


' --- Auth-related Entities ---
package "NextAuth" {
  entity "Account" {
    * **id** : String <<PK>>
    --
    *<u>userId</u>* : String <<FK>>
    type : String
    provider : String
  }
}


' --- Relationships Definition ---

entity "ChatSession" {
  * **id** : String <<PK>>
  --
  title : String
  createdAt : DateTime
  updatedAt : DateTime
  *<u>userId</u>* : String <<FK>>
}

entity "ChatMessage" {
  * **id** : String <<PK>>
  --
  content : String
  role : String
  createdAt : DateTime
  *<u>chatSessionId</u>* : String <<FK>>
}

entity "ChatLogs" {
  * **id** : String <<PK>>
  --
  sessionId : String
  userQuery : String
  detectedIntent : String
  toolUsed : String
  toolInput : Json
  toolOutput : Json
  finalResponse : String
  responseTime : Int
  errorMessage : String
  userId : String
  createdAt : DateTime
}

' --- Relationships Definition ---

User                               ||--o|  Store                 : "owns"
User                               ||--o{ Account               : "has"
User                               ||--o{ Address               : "has"
User                               ||--o{ Order                 : "places"
User                               ||--o{ Rating                : "gives"
User                               ||--o{ UserVoucher           : "collects"
User                               ||--o{ ChatSession           : "has"

Store                              ||--o{ Product               : "sells"
Store                              ||--o{ Order                 : "receives"
Store                              }o--|| VoucherCampaign       : "creates"

Category                           }o--|| Product               : "categorizes"
Category                           }o--|| Product               : "categorizes"
Category                           }o--o{ VoucherCampaign       : "can apply to"
Category                           |o--o{ Category              : "parent of"
Brand                              }o--|| Product               : "is of"

Order                              ||--o{ OrderItem             : "contains"
Order                              }o--o{ UserVoucher           : "uses"
Address                            }o--|| Order                 : "ships to"

Product                            ||--o{ OrderItem             : "is in"
Product                            ||--o{ Rating                : "has"
Product                            ||--o{ OrderItem             : "is in"
Product                            ||--o{ Rating                : "has"
Product                            }o--o{ VoucherCampaign       : "can apply to"
Product                            ||--o{ ProductVariant        : "has variations"

ProductVariant                     ||--o{ OrderItem             : "is in"

VoucherCampaign                    ||--o{ UserVoucher           : "is instance of"

ChatSession                        ||--o{ ChatMessage           : "contains"

```
