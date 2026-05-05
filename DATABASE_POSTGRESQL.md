# PostgreSQL Database Design (Based on ROADMAP)

Last update: 2026-04-26
Target stack: NestJS + TypeORM + PostgreSQL
Scope: Core Platform (v1) + 3 plugins (Cafe, Karaoke, Billiards)

## Tóm tắt tiếng Việt

- Tài liệu này mô tả thiết kế database PostgreSQL cho hệ thống quản lý quán theo mô hình Core + Plugin.
- Core xử lý các thành phần dùng chung: tài khoản, phân quyền, venue, bàn, menu, order, bill, payment.
- Plugin bổ sung tính năng đặc thù cho 3 mô hình mục tiêu: cafe, karaoke (truyền thống/music box/cafe phim), bida.
- Mục tiêu là để team backend có thể tạo migration TypeORM theo thứ tự rõ ràng, đảm bảo dễ mở rộng và dễ bảo trì.

---

## 1) Design goals

Giải thích (VI): Phần này định nghĩa các nguyên tắc thiết kế quan trọng để tránh sửa schema nhiều lần về sau.

- Multi-tenant by venue (one owner can manage many venues)
- RBAC for owner, manager, cashier, waiter, kitchen, customer, guest
- Real-time friendly data model for table status, order flow, room/table timers
- Plugin-first architecture: core tables are shared, plugin tables are isolated
- Auditability: keep order and billing history immutable where needed

---

## 2) PostgreSQL setup

Giải thích (VI): Chuẩn hóa phiên bản, timezone, extension và kiểu dữ liệu ngay từ đầu giúp ổn định khi lên production.

- Version: PostgreSQL 15+
- Timezone: UTC at database level, convert in app layer
- UUID PK: use pgcrypto extension with gen_random_uuid()
- Recommended extensions:

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
```

Notes:

- Use citext for email and username columns when case-insensitive match is needed.
- Use numeric(12,2) for money values to avoid floating-point errors.

---

## 3) Enum definitions

Giải thích (VI): Enum giúp ràng buộc nghiệp vụ ở cấp DB (trạng thái đơn, bill, plugin...), tránh lỗi dữ liệu sai giá trị.

```sql
create type role_code as enum (
  'owner', 'manager', 'cashier', 'waiter', 'kitchen', 'customer', 'guest'
);

create type venue_type as enum (
  'cafe', 'billiards', 'karaoke_traditional', 'music_box', 'cinema_cafe'
);

create type table_status as enum ('available', 'occupied', 'reserved', 'disabled');
create type order_status as enum ('pending', 'confirmed', 'cooking', 'served', 'cancelled');
create type bill_status as enum ('open', 'paid', 'voided', 'refunded');
create type payment_method as enum ('cash', 'bank_transfer', 'vietqr', 'vnpay', 'momo');
create type payment_status as enum ('pending', 'success', 'failed', 'refunded');
create type plugin_code as enum ('cafe', 'karaoke', 'billiards');
create type room_status as enum ('available', 'in_use', 'reserved', 'cleaning', 'disabled');
```

---

## 4) Core schema (v1)

Giải thích (VI): Đây là bộ bảng bắt buộc cho mọi loại quán, dù plugin có bật hay không thì core vẫn phải hoạt động độc lập.

## 4.1 Identity and RBAC

### users

- id uuid pk // Khóa chính định danh người dùng.
- username citext unique not null // Tên đăng nhập duy nhất trong hệ thống, dùng cho đăng nhập bằng mật khẩu.
- email citext unique null // Email đăng nhập, so sánh không phân biệt hoa thường.
- phone varchar(20) unique null // Số điện thoại dùng cho đăng nhập/OTP.
- password_hash text null // Mật khẩu đã băm; có thể rỗng với tài khoản tạo tạm hoặc chờ kích hoạt.
- full_name varchar(150) // Tên hiển thị người dùng.
- gender varchar(20) null // Giới tính (male/female/other/prefer_not_to_say), cho hồ sơ và cá nhân hóa.
- njkname varchar(80) unique null // Biệt danh duy nhất của người dùng trong toàn hệ thống.
- is_active boolean default true // Trạng thái kích hoạt tài khoản.
- created_at timestamptz // Thời điểm tạo tài khoản.
- updated_at timestamptz // Thời điểm cập nhật gần nhất.

### refresh_tokens

- id uuid pk // Khóa chính token refresh.
- user_id uuid fk -> users.id // Người dùng sở hữu token.
- token_hash text // Giá trị refresh token đã băm để lưu an toàn.
- expires_at timestamptz // Thời điểm token hết hạn.
- revoked_at timestamptz null // Thời điểm token bị thu hồi (nếu có).
- created_at timestamptz // Thời điểm phát hành token.

### guest_sessions

- id uuid pk // Định danh phiên khách vãng lai.
- venue_id uuid fk -> venues.id // Quán mà khách đang sử dụng.
- table_id uuid fk -> venue_tables.id // Bàn được gắn với guest session.
- guest_token_hash text unique // Token truy cập tạm thời đã băm.
- expires_at timestamptz // Hạn sử dụng phiên guest.
- closed_at timestamptz null // Thời điểm đóng phiên khi thanh toán xong.
- created_at timestamptz // Thời điểm bắt đầu phiên.

### user_venue_roles

- id uuid pk // Khóa chính của bản ghi phân quyền.
- user_id uuid fk -> users.id // Người dùng được gán quyền.
- venue_id uuid fk -> venues.id // Chi nhánh áp dụng quyền.
- role role_code // Vai trò RBAC trong quán.
- is_active boolean default true // Quyền còn hiệu lực hay đã vô hiệu hóa.
- created_at timestamptz // Thời điểm gán quyền.
- unique(user_id, venue_id, role) // Không cho phép trùng role trên cùng user + venue.

## 4.2 Venue management

### venues

- id uuid pk // Định danh chi nhánh/quán.
- owner_user_id uuid fk -> users.id // Chủ sở hữu quán.
- code varchar(50) unique // Mã định danh nghiệp vụ duy nhất, nên cố định sau khi tạo (ví dụ: HCM-Q1-BIDA-001) để dùng trong URL, báo cáo, đối soát và tích hợp bên thứ ba.
- name varchar(200) // Tên quán.
- venue_type venue_type // Loại hình quán theo enum đã định nghĩa.
- phone varchar(20) // Số liên hệ quán.
- address text // Địa chỉ quán.
- logo_url text null // Link logo quán.
- description text null // Mô tả ngắn về quán.
- is_active boolean default true // Quán đang hoạt động hay tạm khóa.
- created_at timestamptz // Thời điểm tạo venue.
- updated_at timestamptz // Thời điểm cập nhật venue.

Ghi chú thêm cho venues.code (VI):

- Nên theo format có cấu trúc: KhuVuc-Quan/Huyen-LoaiHinh-SoThuTu (ví dụ: HCM-Q1-CAFE-003).
- Không dùng ký tự đặc biệt hoặc dấu cách; ưu tiên chữ in hoa + dấu gạch nối để dễ tìm kiếm/log.
- Không tái sử dụng code cũ khi venue đã đóng để tránh lệch dữ liệu lịch sử.
- Nên expose code ra dashboard cho vận hành, nhưng không dùng làm khóa chính thay cho id uuid.

### venue_settings

- venue_id uuid pk fk -> venues.id // Khóa chính đồng thời liên kết 1-1 với venues.
- timezone varchar(64) default 'Asia/Ho_Chi_Minh' // Múi giờ vận hành của quán.
- vat_percent numeric(5,2) default 0 // Thuế VAT phần trăm.
- service_fee_percent numeric(5,2) default 0 // Phí dịch vụ phần trăm.
- currency_code varchar(3) default 'VND' // Mã tiền tệ (mặc định VND).
- allow_guest_order boolean default true // Cho phép khách chưa đăng nhập gọi món.
- require_order_confirm boolean default false // Có cần nhân viên xác nhận trước khi gửi bếp.
- auto_release_minutes int default 15 // Tự nhả bàn sau số phút không hoạt động.
- guest_session_minutes int default 240 // Thời lượng phiên guest mặc định.
- kitchen_alert_mode varchar(20) default 'both' // Kênh báo bếp (âm thanh/màn hình/cả hai).
- round_bill_rule varchar(30) default 'none' // Quy tắc làm tròn hóa đơn.
- updated_at timestamptz // Thời điểm cập nhật cấu hình.

### venue_business_hours

- id uuid pk // Khóa chính lịch mở cửa.
- venue_id uuid fk -> venues.id // Quán áp dụng lịch.
- weekday smallint check (weekday between 0 and 6) // Thứ trong tuần (0-6).
- open_time time // Giờ mở cửa.
- close_time time // Giờ đóng cửa.
- is_closed boolean default false // Đánh dấu ngày nghỉ của quán.
- unique(venue_id, weekday) // Mỗi quán chỉ có một cấu hình cho mỗi thứ.

### venue_plugins

- id uuid pk // Khóa chính trạng thái plugin.
- venue_id uuid fk -> venues.id // Quán được bật plugin.
- plugin plugin_code // Tên plugin theo enum.
- is_enabled boolean default false // Bật/tắt plugin.
- config_json jsonb default '{}'::jsonb // Cấu hình riêng theo plugin.
- unique(venue_id, plugin) // Mỗi plugin chỉ xuất hiện một lần trên mỗi quán.

### venue_zones

- id uuid pk // Khóa chính khu vực trong quán.
- venue_id uuid fk -> venues.id // Quán sở hữu khu vực.
- name varchar(120) // Tên khu vực (VIP, trong nhà, ngoài trời...).
- description text null // Mô tả khu vực.
- display_order int default 0 // Thứ tự hiển thị trên dashboard.

### venue_tables

- id uuid pk // Khóa chính bàn.
- venue_id uuid fk -> venues.id // Quán chứa bàn.
- zone_id uuid fk -> venue_zones.id null // Khu vực của bàn (có thể rỗng).
- table_code varchar(50) // Mã bàn nội bộ, duy nhất trong quán.
- table_name varchar(100) // Tên hiển thị của bàn.
- capacity int // Sức chứa tối đa.
- status table_status default 'available' // Trạng thái bàn realtime.
- qr_code_value varchar(255) unique // Giá trị QR duy nhất để vào phiên bàn.
- is_active boolean default true // Bàn đang sử dụng hay tạm khóa.
- unique(venue_id, table_code) // Không cho phép trùng mã bàn trong cùng quán.

## 4.3 Menu and ordering

### menu_categories

- id uuid pk // Khóa chính danh mục món.
- venue_id uuid fk -> venues.id // Quán sở hữu danh mục.
- name varchar(120) // Tên danh mục (Nước, Đồ ăn, Combo...).
- description text null // Mô tả danh mục.
- display_order int default 0 // Thứ tự hiển thị trên menu.
- is_active boolean default true // Danh mục còn bán hay tạm ẩn.

### menu_items

- id uuid pk // Khóa chính món.
- venue_id uuid fk -> venues.id // Quán sở hữu món.
- category_id uuid fk -> menu_categories.id // Danh mục chứa món.
- name varchar(200) // Tên món.
- description text null // Mô tả món.
- image_url text null // Ảnh món.
- base_price numeric(12,2) // Giá cơ bản.
- is_available boolean default true // Còn bán hay hết hàng.
- is_best_seller boolean default false // Nhãn bán chạy.
- is_new boolean default false // Nhãn món mới.
- is_promo boolean default false // Nhãn khuyến mãi.
- display_order int default 0 // Thứ tự hiển thị.
- created_at timestamptz // Thời điểm tạo món.
- updated_at timestamptz // Thời điểm cập nhật món.

### dining_sessions

- id uuid pk // Định danh phiên dùng bàn.
- venue_id uuid fk -> venues.id // Quán diễn ra phiên.
- table_id uuid fk -> venue_tables.id // Bàn đang sử dụng.
- opened_by_user_id uuid fk -> users.id null // Nhân viên mở phiên (nếu có).
- guest_session_id uuid fk -> guest_sessions.id null // Phiên guest liên kết (nếu có).
- started_at timestamptz // Thời điểm bắt đầu phiên.
- ended_at timestamptz null // Thời điểm kết thúc phiên.
- is_active boolean default true // Phiên còn hoạt động hay đã đóng.

### orders

- id uuid pk // Khóa chính đơn gọi món.
- venue_id uuid fk -> venues.id // Quán phát sinh đơn.
- session_id uuid fk -> dining_sessions.id // Phiên bàn chứa đơn.
- created_by_user_id uuid fk -> users.id null // Người tạo đơn (khách/nhân viên).
- status order_status default 'pending' // Trạng thái xử lý đơn.
- note text null // Ghi chú chung cho đơn.
- created_at timestamptz // Thời điểm tạo đơn.
- updated_at timestamptz // Thời điểm cập nhật trạng thái.

### order_items

- id uuid pk // Khóa chính dòng món trong đơn.
- order_id uuid fk -> orders.id // Đơn chứa món.
- menu_item_id uuid fk -> menu_items.id // Món gốc trong menu.
- item_name_snapshot varchar(200) // Tên món tại thời điểm đặt để lưu lịch sử.
- unit_price_snapshot numeric(12,2) // Đơn giá tại thời điểm đặt.
- qty int // Số lượng gọi.
- note text null // Ghi chú riêng cho món.
- status order_status default 'pending' // Trạng thái chế biến/phục vụ của món.
- created_at timestamptz // Thời điểm thêm món.

## 4.4 Billing and payment

### bills

- id uuid pk // Khóa chính hóa đơn.
- venue_id uuid fk -> venues.id // Quán phát sinh hóa đơn.
- session_id uuid fk -> dining_sessions.id unique // Phiên bàn tương ứng (1 phiên = 1 bill).
- subtotal numeric(12,2) // Tổng tiền trước thuế/phí/giảm giá.
- vat_amount numeric(12,2) // Tiền VAT.
- service_fee_amount numeric(12,2) // Tiền phí dịch vụ.
- discount_amount numeric(12,2) default 0 // Số tiền giảm giá.
- total_amount numeric(12,2) // Số tiền cuối cùng cần thanh toán.
- status bill_status default 'open' // Trạng thái hóa đơn.
- opened_at timestamptz // Thời điểm mở hóa đơn.
- closed_at timestamptz null // Thời điểm đóng hóa đơn.

### bill_items

- id uuid pk // Khóa chính dòng chi tiết bill.
- bill_id uuid fk -> bills.id // Hóa đơn chứa dòng này.
- order_item_id uuid fk -> order_items.id // Dòng món nguồn từ order.
- item_name_snapshot varchar(200) // Tên món lưu lịch sử trên bill.
- unit_price_snapshot numeric(12,2) // Đơn giá chốt tại thời điểm tính bill.
- qty int // Số lượng tính tiền.
- line_total numeric(12,2) // Thành tiền dòng món.

### payments

- id uuid pk // Khóa chính giao dịch thanh toán.
- bill_id uuid fk -> bills.id // Hóa đơn được thanh toán.
- method payment_method // Phương thức thanh toán.
- status payment_status default 'pending' // Trạng thái giao dịch thanh toán.
- amount numeric(12,2) // Số tiền thanh toán cho giao dịch này.
- provider_txn_id varchar(120) null // Mã giao dịch từ cổng thanh toán.
- paid_at timestamptz null // Thời điểm thanh toán thành công.
- created_at timestamptz // Thời điểm tạo giao dịch.

## 4.5 Notifications and reporting support

### service_calls

- id uuid pk // Khóa chính yêu cầu phục vụ.
- venue_id uuid fk -> venues.id // Quán nhận yêu cầu.
- table_id uuid fk -> venue_tables.id // Bàn gửi yêu cầu.
- session_id uuid fk -> dining_sessions.id null // Phiên liên quan (nếu có).
- call_type varchar(50) -- ice, cleanup, request_bill, other // Loại yêu cầu (thêm đá, dọn bàn, gọi bill...).
- note text null // Ghi chú bổ sung từ khách/nhân viên.
- status varchar(30) default 'new' // Trạng thái xử lý yêu cầu.
- created_at timestamptz // Thời điểm tạo yêu cầu.
- resolved_at timestamptz null // Thời điểm xử lý xong.

### order_events

- id uuid pk // Khóa chính lịch sử trạng thái đơn.
- order_id uuid fk -> orders.id // Đơn được thay đổi.
- from_status order_status null // Trạng thái trước khi đổi.
- to_status order_status // Trạng thái sau khi đổi.
- changed_by_user_id uuid fk -> users.id null // Ai thực hiện thay đổi.
- changed_at timestamptz // Thời điểm thay đổi.

---

## 5) Plugin schema

Giải thích (VI): Các bảng plugin tách riêng khỏi core để bật/tắt theo venue, tránh làm phình schema chung.

## 5.1 Cafe plugin

### cafe_item_variants

- id uuid pk // Khóa chính biến thể món cafe.
- menu_item_id uuid fk -> menu_items.id // Món gốc áp dụng biến thể.
- size_code varchar(20) null -- S/M/L // Cỡ ly (S/M/L).
- sugar_percent smallint null -- 0..100 // Mức đường phần trăm.
- ice_level varchar(20) null -- low/normal/high // Mức đá.
- extra_price numeric(12,2) default 0 // Phụ thu so với giá cơ bản.
- is_active boolean default true // Biến thể còn áp dụng hay không.

### takeaway_tickets

- id uuid pk // Khóa chính phiếu mang về.
- venue_id uuid fk -> venues.id // Quán xử lý đơn mang về.
- order_id uuid fk -> orders.id // Đơn liên kết phiếu.
- queue_number int // Số thứ tự hiển thị trên quầy.
- customer_name varchar(120) null // Tên khách nhận đồ.
- status varchar(30) default 'queued' -- queued/preparing/ready/picked_up // Trạng thái chuẩn bị đơn mang về.
- created_at timestamptz // Thời điểm cấp phiếu.
- ready_at timestamptz null // Thời điểm đồ uống/món sẵn sàng.

### loyalty_wallets

- id uuid pk // Khóa chính ví loyalty.
- venue_id uuid fk -> venues.id // Quán áp dụng loyalty.
- customer_user_id uuid fk -> users.id // Khách hàng sở hữu ví.
- points_balance int default 0 // Số điểm hiện tại.
- stamp_balance int default 0 // Số stamp hiện tại.
- updated_at timestamptz // Thời điểm cập nhật điểm/stamp.
- unique(venue_id, customer_user_id) // Một khách chỉ có một ví loyalty trong mỗi quán.

## 5.2 Karaoke plugin (traditional/music_box/cinema_cafe)

### karaoke_rooms

- id uuid pk // Khóa chính phòng karaoke.
- venue_id uuid fk -> venues.id // Quán sở hữu phòng.
- room_code varchar(50) // Mã phòng nội bộ, duy nhất trong quán.
- room_name varchar(120) // Tên phòng hiển thị.
- capacity int // Sức chứa phòng.
- status room_status default 'available' // Trạng thái phòng realtime.
- hourly_rate numeric(12,2) // Đơn giá theo giờ.
- room_type varchar(30) -- traditional/music_box/cinema // Loại phòng (truyền thống/music box/cinema).
- unique(venue_id, room_code) // Không cho phép trùng mã phòng trong cùng quán.

### karaoke_bookings

- id uuid pk // Khóa chính booking phòng.
- venue_id uuid fk -> venues.id // Quán nhận booking.
- room_id uuid fk -> karaoke_rooms.id // Phòng được đặt.
- customer_user_id uuid fk -> users.id null // Khách đặt phòng (nếu có tài khoản).
- start_time timestamptz // Giờ bắt đầu dự kiến.
- end_time timestamptz // Giờ kết thúc dự kiến.
- actual_end_time timestamptz null // Giờ kết thúc thực tế.
- status varchar(30) default 'booked' -- booked/in_use/completed/cancelled // Trạng thái booking.
- created_at timestamptz // Thời điểm tạo booking.

### karaoke_session_modes

- id uuid pk // Khóa chính cấu hình mode phiên.
- booking_id uuid fk -> karaoke_bookings.id unique // Booking tương ứng (1 booking = 1 mode).
- mode varchar(30) not null -- karaoke/music_box/cinema_cafe // Chế độ vận hành của phiên.
- config_json jsonb default '{}'::jsonb // Cấu hình mở rộng theo mode.

### cinema_streaming_accounts

- id uuid pk // Khóa chính tài khoản streaming.
- venue_id uuid fk -> venues.id // Quán sở hữu tài khoản.
- room_id uuid fk -> karaoke_rooms.id null // Phòng được phân công tài khoản cố định (nếu có).
- provider varchar(30) // Nhà cung cấp: netflix, youtube, spotify, fptplay...
- account_name varchar(120) // Tên gợi nhớ tài khoản để vận hành dễ chọn.
- login_identifier varchar(180) // Email/số điện thoại đăng nhập tài khoản streaming.
- credential_secret_ref text // Tham chiếu tới nơi lưu secret đã mã hóa (không lưu password thô).
- profile_name varchar(80) null // Profile sử dụng trong nền tảng streaming (nếu có).
- pin_code_hash text null // Mã PIN đã băm (nếu nhà cung cấp yêu cầu pin).
- is_active boolean default true // Tài khoản còn cho thuê/sử dụng hay không.
- rent_price_per_session numeric(12,2) default 0 // Giá thuê tài khoản cho mỗi phiên sử dụng.
- notes text null // Ghi chú vận hành: giới hạn thiết bị, cảnh báo đăng xuất...
- created_at timestamptz // Thời điểm tạo tài khoản.
- updated_at timestamptz // Thời điểm cập nhật tài khoản.

### cinema_streaming_usages

- id uuid pk // Khóa chính lịch sử thuê/sử dụng tài khoản streaming.
- venue_id uuid fk -> venues.id // Quán phát sinh usage.
- booking_id uuid fk -> karaoke_bookings.id // Phiên phòng/cinema sử dụng tài khoản.
- streaming_account_id uuid fk -> cinema_streaming_accounts.id // Tài khoản được cấp cho phiên.
- assigned_by_user_id uuid fk -> users.id null // Nhân viên gán tài khoản cho khách.
- started_at timestamptz // Thời điểm bắt đầu sử dụng.
- ended_at timestamptz null // Thời điểm kết thúc sử dụng.
- rental_fee numeric(12,2) default 0 // Phí thuê thực tế thu từ khách.
- status varchar(30) default 'active' // active/completed/cancelled/issue.
- issue_note text null // Ghi chú sự cố: khóa tài khoản, đăng nhập thất bại...
- created_at timestamptz // Thời điểm tạo bản ghi usage.

## 5.3 Billiards plugin

### billiard_tables

- id uuid pk // Khóa chính bảng cấu hình bàn bida.
- venue_id uuid fk -> venues.id // Quán sở hữu bàn bida.
- table_id uuid fk -> venue_tables.id unique // Liên kết sang bàn chung của hệ thống.
- game_type varchar(30) default 'billiards' // Loại game trên bàn.
- default_hourly_rate numeric(12,2) // Giá giờ mặc định.

### billiard_rate_rules

- id uuid pk // Khóa chính rule giá.
- venue_id uuid fk -> venues.id // Quán áp dụng rule.
- name varchar(120) // Tên rule (giờ vàng, cuối tuần...).
- day_of_week smallint null // Áp dụng theo thứ cụ thể (nếu có).
- start_time time null // Giờ bắt đầu áp dụng.
- end_time time null // Giờ kết thúc áp dụng.
- hourly_rate numeric(12,2) // Mức giá theo giờ của rule.
- is_active boolean default true // Rule còn hiệu lực.

### billiard_sessions

- id uuid pk // Khóa chính phiên chơi bida.
- venue_id uuid fk -> venues.id // Quán diễn ra phiên chơi.
- billiard_table_id uuid fk -> billiard_tables.id // Bàn bida được sử dụng.
- started_at timestamptz // Thời điểm bắt đầu chơi.
- ended_at timestamptz null // Thời điểm kết thúc chơi.
- duration_minutes int generated always as (
  case when ended_at is null then null
  else floor(extract(epoch from (ended_at - started_at)) / 60)::int end
  ) stored // Tổng phút chơi, tự tính từ started_at/ended_at.
- calculated_amount numeric(12,2) null // Tiền giờ đã tính cho phiên.
- bill_id uuid fk -> bills.id null // Hóa đơn liên kết (nếu đã chốt bill).

### billiard_scoreboards

- id uuid pk // Khóa chính bảng điểm.
- session_id uuid fk -> billiard_sessions.id // Phiên chơi liên quan.
- team_a_score int default 0 // Điểm đội A.
- team_b_score int default 0 // Điểm đội B.
- updated_at timestamptz // Thời điểm cập nhật điểm gần nhất.

---

## 6) Index strategy

Giải thích (VI): Index ưu tiên cho các truy vấn vận hành realtime (bàn đang dùng, đơn đang chờ, bill chưa đóng, lịch đặt phòng).

Minimum indexes:

- users(username), users(email), users(phone), users(njkname)
- user_venue_roles(venue_id, role), user_venue_roles(user_id, venue_id)
- venue_tables(venue_id, status)
- dining_sessions(venue_id, is_active), dining_sessions(table_id, is_active)
- orders(venue_id, created_at), orders(session_id, status)
- order_items(order_id, status)
- bills(venue_id, status, opened_at)
- payments(bill_id, status)
- karaoke_bookings(room_id, start_time, end_time)
- cinema_streaming_accounts(venue_id, provider, is_active)
- cinema_streaming_usages(booking_id, status), cinema_streaming_usages(streaming_account_id, started_at)
- billiard_sessions(billiard_table_id, started_at)

Optional advanced indexes:

- GIN on venue_plugins(config_json)
- GIN on karaoke_session_modes(config_json)
- Partial index: orders(status) where status in ('pending', 'confirmed', 'cooking')

---

## 7) Suggested migration order (TypeORM)

Giải thích (VI): Cần tạo bảng theo thứ tự phụ thuộc khóa ngoại (FK) để migration chạy an toàn và dễ rollback.

1. Create enums + extensions
2. Create identity tables: users, refresh_tokens, user_venue_roles
3. Create venue tables: venues, venue_settings, venue_business_hours, venue_plugins, venue_zones, venue_tables
4. Create menu/order tables: menu_categories, menu_items, guest_sessions, dining_sessions, orders, order_items
5. Create billing tables: bills, bill_items, payments
6. Create support tables: service_calls, order_events
7. Create plugin tables: cafe*\*, karaoke*_, billiard\__
8. Add performance indexes and unique constraints

---

## 8) Mapping to current roadmap

Giải thích (VI): Bảng mapping này giúp đối chiếu trực tiếp từ ROADMAP sang schema, tránh thiếu module khi implement.

- Auth & RBAC: users, user_venue_roles, refresh_tokens, guest_sessions
- Venue management: venues, venue_settings, venue_business_hours, venue_plugins, venue_zones, venue_tables
- Menu/order realtime: menu_categories, menu_items, dining_sessions, orders, order_items, order_events
- Billing/payment: bills, bill_items, payments
- Cafe plugin: cafe_item_variants, takeaway_tickets, loyalty_wallets
- Karaoke plugin: karaoke_rooms, karaoke_bookings, karaoke_session_modes, cinema_streaming_accounts, cinema_streaming_usages
- Billiards plugin: billiard_tables, billiard_rate_rules, billiard_sessions, billiard_scoreboards

---

## 9) Open decisions before implementation

Giải thích (VI): Đây là các điểm cần chốt với team business/tech lead trước khi đóng băng schema và viết migration chính thức.

- Soft delete strategy: use deleted_at columns globally or only for selected tables?
- Money precision for VND: keep numeric(12,2) or numeric(14,0)?
- Reservation support for v1: store in core now or add in plugin phase?
- Multi-branch reporting strategy: OLTP only or add warehouse later?
- Session cache split: what must stay in PostgreSQL vs Redis?
