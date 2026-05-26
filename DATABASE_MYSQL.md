# MySQL Database Design

> Last update: 2026-05-26
> Stack: NestJS + TypeORM + MySQL 8
> Scope: Một quán ăn — QR gọi món, hỗ trợ combo/buffet + à la carte

---

## Tóm tắt

19 bảng, 6 nhóm. Khái niệm trung tâm: **dining_session** (phiên bàn) có thể chứa cả combo lẫn à la carte. Bill tổng hợp cuối phiên.

---

## Enum

```sql
role_code      : owner | manager | cashier | waiter | kitchen
table_status   : available | occupied | reserved | disabled
order_type     : combo | per_item
combo_status   : requested | served | cancelled
per_item_status: pending | confirmed | cooking | served | cancelled
bill_status    : open | paid | voided
payment_method : cash | bank_transfer | qr_banking
```

---

## 1. Auth

### users

| Column        | Type           | Ghi chú              |
| ------------- | -------------- | -------------------- |
| id            | varchar(36) PK |                      |
| username      | varchar(255)   | unique               |
| email         | varchar(255)   | unique, nullable     |
| phone         | varchar(20)    | unique, nullable     |
| password_hash | text           | nullable             |
| full_name     | varchar(150)   |                      |
| is_active     | boolean        | default true         |
| created_at    | datetime       |                      |
| updated_at    | datetime       |                      |

### user_roles

| Column     | Type           | Ghi chú              |
| ---------- | -------------- | -------------------- |
| id         | varchar(36) PK |                      |
| user_id    | varchar(36) FK → users.id |           |
| role       | enum(role_code)|                      |
| is_active  | boolean        | default true         |
| created_at | datetime       |                      |

> unique(user_id, role)

### refresh_tokens

| Column     | Type           | Ghi chú              |
| ---------- | -------------- | -------------------- |
| id         | varchar(36) PK |                      |
| user_id    | varchar(36) FK → users.id |           |
| token_hash | text           |                      |
| expires_at | datetime       |                      |
| created_at | datetime       |                      |

---

## 2. Bàn & Guest

### tables

| Column        | Type           | Ghi chú                       |
| ------------- | -------------- | ----------------------------- |
| id            | varchar(36) PK |                               |
| table_code    | varchar(50)    | unique — A1, B2…              |
| table_name    | varchar(100)   |                               |
| capacity      | int            |                               |
| status        | enum           | default available             |
| qr_code_value | varchar(255)   | unique                        |
| is_active     | boolean        | default true                  |

### guest_sessions

| Column           | Type           | Ghi chú              |
| ---------------- | -------------- | -------------------- |
| id               | varchar(36) PK |                      |
| table_id         | varchar(36) FK → tables.id |         |
| guest_token_hash | varchar(255)   | unique               |
| expires_at       | datetime       |                      |
| closed_at        | datetime       | nullable             |
| created_at       | datetime       |                      |

---

## 3. Menu

### menu_categories

| Column        | Type           | Ghi chú                    |
| ------------- | -------------- | -------------------------- |
| id            | varchar(36) PK |                            |
| name          | varchar(120)   | Khai vị, Món chính, Tráng miệng, Đồ uống… |
| display_order | int            | default 0                  |
| is_active     | boolean        | default true               |
| created_at    | datetime       |                            |
| updated_at    | datetime       |                            |

### menu_items

| Column         | Type           | Ghi chú                          |
| -------------- | -------------- | -------------------------------- |
| id             | varchar(36) PK |                                  |
| category_id    | varchar(36) FK → menu_categories.id |            |
| name           | varchar(200)   |                                  |
| description    | text           | nullable                         |
| image_url      | text           | nullable                         |
| price          | decimal(12,2)  | giá à la carte                   |
| is_active      | boolean        | default true                     |
| is_available   | boolean        | default true                     |
| is_best_seller | boolean        | default false                    |
| is_new         | boolean        | default false                    |
| is_promo       | boolean        | default false                    |
| display_order  | int            | default 0                        |
| created_at     | datetime       |                                  |
| updated_at     | datetime       |                                  |

---

## 4. Combo / Buffet

### combos

Gói trả trước một lần, cho phép gọi các món trong danh sách combo.

| Column         | Type           | Ghi chú                                           |
| -------------- | -------------- | ------------------------------------------------- |
| id             | varchar(36) PK |                                                   |
| name           | varchar(200)   | VD: Combo Lẩu 1 người, Buffet Nướng 2 tiếng       |
| description    | text           | nullable                                          |
| price          | decimal(12,2)  | giá mỗi người mua combo                           |
| valid_hours    | int            | nullable — giới hạn thời gian (VD: 2 tiếng), null = không giới hạn |
| is_active      | boolean        | default true                                      |
| created_at     | datetime       |                                                   |
| updated_at     | datetime       |                                                   |

### combo_items

Danh sách món được phép gọi trong combo và giới hạn số lượng.

| Column          | Type           | Ghi chú                                              |
| --------------- | -------------- | ---------------------------------------------------- |
| id              | varchar(36) PK |                                                      |
| combo_id        | varchar(36) FK → combos.id |                                     |
| menu_item_id    | varchar(36) FK → menu_items.id |                                 |
| qty_limit       | int            | nullable — null = không giới hạn; số = giới hạn/người/phiên |

> unique(combo_id, menu_item_id)

---

## 5. Ordering

### dining_sessions

Phiên ngồi bàn — từ lúc scan QR đến lúc thanh toán.

| Column              | Type           | Ghi chú                              |
| ------------------- | -------------- | ------------------------------------ |
| id                  | varchar(36) PK |                                      |
| table_id            | varchar(36) FK → tables.id |                       |
| guest_session_id    | varchar(36) FK → guest_sessions.id | nullable  |
| opened_by_user_id   | varchar(36) FK → users.id | nullable           |
| started_at          | datetime       |                                      |
| ended_at            | datetime       | nullable                             |
| is_active           | boolean        | default true                         |

### dining_session_combos

Ghi nhận combo mà khách mua trong phiên này. Nhiều người cùng bàn có thể mua cùng 1 combo (VD: 3 người × combo A).

| Column              | Type           | Ghi chú                                  |
| ------------------- | -------------- | ---------------------------------------- |
| id                  | varchar(36) PK |                                          |
| dining_session_id   | varchar(36) FK → dining_sessions.id |          |
| combo_id            | varchar(36) FK → combos.id |                 |
| person_count        | int            | số người mua combo này (VD: 3)            |
| unit_price_snapshot | decimal(12,2)  | giá combo lúc mua                        |
| started_at          | datetime       | thời điểm kích hoạt                      |
| expires_at          | datetime       | nullable — null nếu combo không giới hạn giờ |

### orders

Một lần gọi món trong phiên bàn.

| Column              | Type                | Ghi chú                                       |
| ------------------- | ------------------- | --------------------------------------------- |
| id                  | varchar(36) PK      |                                               |
| dining_session_id   | varchar(36) FK → dining_sessions.id |                 |
| order_type          | enum(order_type)    | combo hoặc per_item                           |
| session_combo_id    | varchar(36) FK → dining_session_combos.id | nullable — chỉ điền nếu order_type = combo |
| created_by_user_id  | varchar(36) FK → users.id | nullable                          |
| status              | varchar(20)         | trạng thái tổng hợp để query nhanh; combo: `requested/served/cancelled`, per_item: `pending/confirmed/cooking/served/cancelled` |
| note                | text                | nullable                                      |
| created_at          | datetime            |                                               |
| updated_at          | datetime            |                                               |

> Ghi chú: trạng thái thực tế nên theo `order_items.status`; `orders.status` là trạng thái tổng hợp của cả lần gọi món.

### order_items

| Column                | Type           | Ghi chú                                              |
| --------------------- | -------------- | ---------------------------------------------------- |
| id                    | varchar(36) PK |                                                      |
| order_id              | varchar(36) FK → orders.id |                                     |
| menu_item_id          | varchar(36) FK → menu_items.id |                                 |
| item_name_snapshot    | varchar(200)   |                                                      |
| unit_price_snapshot   | decimal(12,2)  | 0 nếu được cover bởi combo                           |
| qty                   | int            |                                                      |
| is_covered_by_combo   | boolean        | true = nằm trong combo, false = tính tiền riêng       |
| note                  | text           | nullable                                             |
| status                | varchar(20)    | combo: mặc định `requested`; per_item: mặc định `pending` |
| created_at            | datetime       |                                                      |

### order_events

Lưu lịch sử đổi trạng thái. Ưu tiên log theo từng món để khớp KDS/realtime.

| Column              | Type           | Ghi chú       |
| ------------------- | -------------- | ------------- |
| id                  | varchar(36) PK |               |
| order_id            | varchar(36) FK → orders.id |   |
| order_item_id       | varchar(36) FK → order_items.id | nullable — nên điền khi đổi trạng thái từng món |
| from_status         | varchar(20)    | nullable      |
| to_status           | varchar(20)    |               |
| changed_by_user_id  | varchar(36) FK → users.id | nullable |
| changed_at          | datetime       |               |

---

## 6. Billing & Support

### bills

| Column              | Type           | Ghi chú                                                     |
| ------------------- | -------------- | ----------------------------------------------------------- |
| id                  | varchar(36) PK |                                                             |
| dining_session_id   | varchar(36) FK → dining_sessions.id | unique                   |
| combo_total         | decimal(12,2)  | tổng tiền combo (sum of person_count × unit_price_snapshot) |
| per_item_total      | decimal(12,2)  | tổng tiền món gọi thêm ngoài combo                          |
| vat_amount          | decimal(12,2)  | default 0                                                   |
| discount_amount     | decimal(12,2)  | default 0                                                   |
| total_amount        | decimal(12,2)  | combo_total + per_item_total + vat - discount               |
| status              | enum(bill_status) | default open                                             |
| opened_at           | datetime       |                                                             |
| closed_at           | datetime       | nullable                                                    |

### payments

| Column          | Type           | Ghi chú       |
| --------------- | -------------- | ------------- |
| id              | varchar(36) PK |               |
| bill_id         | varchar(36) FK → bills.id |   |
| method          | enum(payment_method) |        |
| amount          | decimal(12,2)  |               |
| provider_txn_id | varchar(120)   | nullable      |
| paid_at         | datetime       | nullable      |
| created_at      | datetime       |               |

### service_calls

| Column              | Type           | Ghi chú                               |
| ------------------- | -------------- | ------------------------------------- |
| id                  | varchar(36) PK |                                       |
| table_id            | varchar(36) FK → tables.id |               |
| dining_session_id   | varchar(36) FK → dining_sessions.id | nullable |
| call_type           | varchar(50)    | ice / cleanup / request_bill / other  |
| note                | text           | nullable                              |
| status              | varchar(30)    | default new                           |
| created_at          | datetime       |                                       |
| resolved_at         | datetime       | nullable                              |

### coupons

Định nghĩa mã giảm giá — owner/manager tạo thủ công hoặc hệ thống tự phát.

| Column              | Type           | Ghi chú                                                          |
| ------------------- | -------------- | ---------------------------------------------------------------- |
| id                  | varchar(36) PK |                                                                  |
| code                | varchar(50)    | unique — mã khách nhập, VD: WELCOME10                            |
| description         | varchar(255)   | nullable — mô tả hiển thị cho khách                              |
| discount_type       | enum           | percent \| fixed                                                 |
| discount_value      | decimal(12,2)  | 10 = giảm 10% hoặc giảm 10.000đ tùy discount_type               |
| min_order_amount    | decimal(12,2)  | nullable — bill tối thiểu mới được dùng                          |
| max_discount_amount | decimal(12,2)  | nullable — trần giảm tối đa (chỉ có nghĩa khi type = percent)   |
| total_limit         | int            | nullable — tổng số lần dùng của cả mã, null = không giới hạn    |
| used_count          | int            | default 0 — đếm số lần đã dùng                                  |
| valid_from          | datetime       |                                                                  |
| valid_until         | datetime       | nullable — null = không hết hạn                                  |
| is_active           | boolean        | default true                                                     |
| created_at          | datetime       |                                                                  |

### coupon_usages

Lịch sử dùng mã — kiểm tra theo SĐT, không cần tài khoản.

| Column          | Type           | Ghi chú                             |
| --------------- | -------------- | ----------------------------------- |
| id              | varchar(36) PK |                                     |
| coupon_id       | varchar(36) FK → coupons.id |            |
| phone           | varchar(20)    | SĐT khách nhập                      |
| bill_id         | varchar(36) FK → bills.id |              |
| discount_amount | decimal(12,2)  | số tiền thực tế đã giảm             |
| used_at         | datetime       |                                     |

> unique(coupon_id, phone) — mỗi SĐT chỉ dùng 1 lần/mã

---

## Sơ đồ quan hệ

```
users ──── user_roles
  │
  └── refresh_tokens

tables ──── guest_sessions
  │               │
  └── dining_sessions ───────────────────────────┐
            │                                    │
            ├── dining_session_combos             │
            │   (combo × person_count)            │
            │          │                          │
            ├── orders ─┘                         │
            │   (order_type: combo|per_item)      │
            │          └── order_items            │
            │              (is_covered_by_combo, item status) │
            │              └── order_events       │
            │                                     │
            ├── bills ────────────────────────────┘
            │      ├── payments
            │      └── coupon_usages ──── coupons
            └── service_calls

menu_categories ──── menu_items ◄── combo_items ──── combos
                          │
                    order_items (snapshot)
```

---

## Logic kiểm tra quota combo (application layer)

Khi khách gọi món thuộc combo:
1. Tìm `dining_session_combos` active trong phiên
2. Tìm `combo_items` của combo đó với `menu_item_id` tương ứng
3. Nếu `qty_limit` là null → `is_covered_by_combo = true`, `unit_price_snapshot = 0`
4. Nếu `qty_limit` có giá trị → đếm `order_items` đã gọi món này trong phiên × person_count
   - Còn quota → `is_covered_by_combo = true`
   - Hết quota → `is_covered_by_combo = false`, tính giá à la carte

## Logic trạng thái order (application layer)

- `order_type = combo`: món đi theo luồng `requested → served` vì là món đã chuẩn bị sẵn, không qua `cooking`
- `order_type = per_item`: món đi theo luồng `pending → confirmed → cooking → served`
- `order_items.status` là nguồn sự thật cho realtime/KDS
- `orders.status` được suy ra từ toàn bộ `order_items` để phục vụ filter và query nhanh

---

## Thứ tự tạo bảng

1. `users`
2. `user_roles`, `refresh_tokens`
3. `tables`
4. `guest_sessions`
5. `menu_categories`, `menu_items`
6. `combos`, `combo_items`
7. `dining_sessions`
8. `dining_session_combos`
9. `orders`, `order_items`, `order_events`
10. `bills`, `payments`
11. `service_calls`
12. `coupons`, `coupon_usages`

---

## Index cần thiết

```
users                   : username, email, phone
user_roles              : (user_id, role)
tables                  : status, qr_code_value
dining_sessions         : table_id + is_active
dining_session_combos   : dining_session_id, expires_at
orders                  : dining_session_id + status, session_combo_id
order_items             : order_id + status, is_covered_by_combo
order_events            : order_id, order_item_id, changed_at
bills                   : dining_session_id, status
service_calls           : table_id + status
coupons                 : code, is_active
coupon_usages           : (coupon_id, phone)
```
