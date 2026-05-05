  # 🍻 Smart Table & Game Booking — Project Roadmap

> **Cập nhật lần cuối:** 2026-04-26
> **Kiến trúc:** Core Platform (dùng chung mọi quán) + Venue Plugins (tính năng riêng từng loại quán)

---

## 🎯 Vision

Nền tảng SaaS tập trung cho 3 mô hình chính: bida, quán nước/cafe và karaoke truyền thống (mở rộng music box/cafe phim):

- Chủ quán cài đặt một lần, khách dùng ngay qua QR
- Không cần gọi nhân viên · Không cần chờ menu · Không cần ghi giấy
- Mở rộng theo từng loại hình bằng cách bật thêm **plugin**

---

## 🏛️ Kiến trúc tổng quan

```
┌─────────────────────────────────────────────┐
│              CORE PLATFORM (v1)             │
│  Auth · Menu · Order · Table · Bill · QR   │
└────────────────┬────────────────────────────┘
                 │ extends
    ┌────────────┼────────────┐
    ▼            ▼            ▼
  [☕ Cafe]   [🎤 Karaoke]  [🎱 Bida]
   Plugin       Plugin        Plugin
```

> **Nguyên tắc:** Một quán mới chỉ cần bật đúng plugin phù hợp, không cần code lại từ đầu.

---

## 🟦 VERSION 1 — Core Platform

> **Mục tiêu:** Base project hoạt động được tại BẤT KỲ loại quán nào ngay khi cài xong.

### 👤 Auth & Phân quyền (RBAC)

**Mô hình Role-Based Access Control:**

```
Owner
 └── Manager
      └── Staff (Cashier / Waiter / Kitchen)
Customer (Authenticated hoặc Guest)
```

**Roles & Permissions:**

| Role                         | Quyền                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| `owner`: Chủ cơ sở           | Toàn quyền: cài đặt venue, quản lý staff, xem báo cáo, billing     |
| `manager`: Quản lý           | Quản lý menu, bàn, order, xem báo cáo — không xóa venue            |
| `cashier`: Thu ngân          | Tạo/đóng bill, xem danh sách order, thanh toán                     |
| `waiter`: Nhiên viên phục vụ | Tạo order, cập nhật trạng thái bàn, gọi món thay khách             |
| `kitchen`: Nhiên viên bếp    | Chỉ xem màn hình bếp, cập nhật trạng thái món (`Cooking → Served`) |
| `customer`: Khách hàng       | Xem menu, đặt món, theo dõi order của bàn mình                     |
| `guest`: Khách               | Như `customer` nhưng không cần tài khoản (session tạm theo QR)     |

**Luồng đăng nhập:**

```
Staff / Owner:
  Username + Password → JWT (access 15p) + Refresh Token (7 ngày)

Customer — 2 luồng:
  1. Guest: Scan QR → tạo guest session (không cần đăng nhập)
             → session gắn với tableId + expiry theo giờ hoạt động
  2. Logged-in: Đăng nhập Username + Password hoặc SĐT + OTP → scan QR → gắn account vào session
               → lịch sử order, tích điểm loyalty

Guest Session:
  - Lưu token tạm trong cookie / localStorage
  - Hết session (đóng bill) → token hết hạn
  - Không lưu lịch sử, không tích điểm
```

**Checklist:**

- [ ] RBAC Guard (`@Roles(...)`) áp dụng toàn bộ API
- [ ] JWT access token (15 phút) + Refresh token (7 ngày)
- [ ] Guest session: tạo temp token khi scan QR, gắn `tableId`
- [ ] Owner tạo / vô hiệu hoá tài khoản Staff, gán role
- [ ] Mỗi tài khoản có `username` duy nhất để đăng nhập (không dùng Google OAuth)
- [ ] Customer đăng ký / đăng nhập qua SĐT + OTP
- [ ] Middleware: Guest chỉ được gọi món trong bàn của mình

### 🏪 Venue Management

**Cấu trúc dữ liệu:**

```
Owner (account)
 └── Venue (chi nhánh)
      ├── Settings (giờ, thuế, plugin…)
      ├── Zone (khu vực: trong nhà / ngoài trời / VIP)
      │    └── Table (bàn, QR)
      ├── Menu → Category → Item
      └── Staff (gán theo venue)
```

**Onboarding — Owner tạo quán:**

- [ ] Bước 1 — Thông tin cơ bản: tên quán, địa chỉ, SĐT, logo, loại hình (`cafe` / `billiards` / `karaoke_traditional` / `music_box` / `cinema_cafe`)
- [ ] Bước 2 — Giờ hoạt động: mở/đóng cửa theo từng ngày trong tuần, ngày nghỉ lễ
- [ ] Bước 3 — Cài đặt tài chính: VAT (%), phí dịch vụ (%), đơn vị tiền tệ
- [ ] Bước 4 — Chọn Venue Plugins muốn bật (xác định loại hình)

**Venue Settings (cấu hình sau khi tạo):**

| Nhóm          | Chi tiết                                                            |
| ------------- | ------------------------------------------------------------------- |
| Thông tin     | Tên, địa chỉ, logo, mô tả, SĐT, website                             |
| Giờ hoạt động | Lịch mở cửa theo thứ, khung giờ cao điểm                            |
| Tài chính     | VAT, phí dịch vụ, làm tròn hoá đơn                                  |
| Order         | Cho phép guest order không, yêu cầu confirm trước khi gửi bếp không |
| QR & Bàn      | Thời gian auto-release bàn (phút), thời gian guest session          |
| Thông báo     | Kênh alert bếp (âm thanh / màn hình / cả hai)                       |
| Plugin        | Bật / tắt từng Venue Plugin                                         |

**Zone & Table:**

- [ ] Tạo Zone (khu vực): tên, mô tả, thứ tự hiển thị
- [ ] Tạo bàn trong Zone: tên bàn, sức chứa (số người tối đa)
- [ ] Mỗi bàn có QR code riêng (generate + tải về để in)
- [ ] Bật / tắt bàn (tạm đóng bàn đang sửa chữa)

**Multi-venue:**

- [ ] 1 owner account quản lý nhiều venue (chuỗi quán)
- [ ] Chuyển nhanh giữa các venue trong dashboard
- [ ] Báo cáo tổng hợp toàn chuỗi hoặc theo từng chi nhánh

### 🪑 Quản lý bàn / khu vực

- [ ] CRUD bàn (tên bàn, sức chứa, khu vực: trong/ngoài/VIP)
- [ ] Layout map trực quan (drag-drop sắp xếp bàn)
- [ ] Trạng thái bàn realtime: 🟢 Available · 🔴 Occupied · 🟡 Reserved
- [ ] Generate QR code riêng cho từng bàn
- [ ] WebSocket: broadcast trạng thái bàn tới tất cả client

### 📋 Menu Management

- [ ] CRUD danh mục (Category) và món (Item)
- [ ] Ảnh món, mô tả, giá
- [ ] Bật / tắt món theo ngày (hết hàng)
- [ ] Sắp xếp thứ tự hiển thị
- [ ] Tag: best seller, mới, khuyến mãi

### 🍔 Order Realtime (tại bàn)

- [ ] Khách scan QR → vào session bàn đó
- [ ] Xem menu, chọn món, ghi chú (không cay, không đá…)
- [ ] Gửi order → WebSocket đẩy về bếp / quầy ngay lập tức
- [ ] Trạng thái order: `Pending → Confirmed → Cooking → Served`
- [ ] Khách theo dõi trạng thái order realtime
- [ ] Thêm món bất kỳ lúc nào trong session

### 🧑‍🍳 Staff & Kitchen Dashboard

- [ ] **Màn hình bếp (KDS):** nhận order realtime, kéo thả đổi trạng thái
- [ ] Timer từng món (alert nếu quá 10 phút chưa xử lý)
- [ ] Ghi chú dị ứng / yêu cầu đặc biệt nổi bật màu đỏ
- [ ] **Màn hình quản lý:** danh sách bàn đang active, order đang chờ
- [ ] Nhân viên có thể tạo order thay khách (walk-in)

### 💸 Billing & Thanh toán cơ bản

- [ ] Tổng tiền tự động cập nhật khi thêm món
- [ ] In / xuất bill (PDF hoặc in nhiệt)
- [ ] Thanh toán tại quầy (tiền mặt / chuyển khoản)
- [ ] Lưu lịch sử đơn hàng

### 🔔 Notification cơ bản

- [ ] In-app: order status thay đổi
- [ ] Gọi nhân viên one-tap (kèm lý do: cần đá, dọn bàn, hỏi bill)
- [ ] Alert bếp khi có order mới

### 📊 Reports cơ bản

- [ ] Doanh thu theo ngày / tuần / tháng
- [ ] Top món bán chạy
- [ ] Số lượng khách / lượt bàn theo giờ

---

## 🟨 VENUE PLUGINS (Phát triển sau v1)

> Mỗi plugin là một module độc lập, bật/tắt trong settings của venue.

---

### ☕ Plugin: Quán Nước / Cafe

**Vấn đề đặc thù:** Đồ uống có nhiều biến thể (size, đường, đá), khách hay mua take-away.

| Feature       | Mô tả                                                     | Status     |
| ------------- | --------------------------------------------------------- | ---------- |
| Item Variants | Tuỳ chọn size (S/M/L), đường (0%–100%), đá (ít/vừa/nhiều) | 📋 Planned |
| Takeaway Mode | Order mang về, nhân viên gọi tên / số thứ tự khi xong     | 📋 Planned |
| Loyalty Stamp | Mua 9 ly tặng 1 ly (digital stamp card)                   | 📋 Planned |
| Subscription  | Gói tháng: 20 ly cafe/tháng giảm 30%                      | 📋 Planned |
| Queue Display | Màn hình hiển thị số thứ tự đang pha / đã xong            | 📋 Planned |

---

### 🎤 Plugin: Karaoke Truyền Thống / Music Box / Cafe Phim

**Vấn đề đặc thù:** Đặt phòng theo giờ, tính tiền theo thời gian, quản lý phòng.

| Feature            | Mô tả                                                                                      | Status     |
| ------------------ | ------------------------------------------------------------------------------------------ | ---------- |
| Room Booking       | Đặt phòng theo slot (1h / 2h / 3h), chọn loại phòng (4-8-12 người)                         | 📋 Planned |
| Room Timer         | Đồng hồ đếm giờ realtime, cảnh báo 15 phút trước hết giờ                                   | 📋 Planned |
| Extend Room        | Gia hạn thêm giờ ngay từ app trong phòng                                                   | 📋 Planned |
| Package Deal       | Combo: phòng + đồ ăn + nước (giá trọn gói)                                                 | 📋 Planned |
| Room Service       | Gọi đồ ăn / nước vào phòng, không cần ra ngoài                                             | 📋 Planned |
| Song Request       | Khách request bài qua app, màn hình queue bài hát (áp dụng karaoke truyền thống/music box) | 📋 Planned |
| Room Status Board  | Màn hình lễ tân: phòng nào trống/đang dùng/sắp hết giờ                                     | 📋 Planned |
| Media Session Mode | Chế độ theo phiên: karaoke / music box / cafe phim để bật đúng tính năng vận hành          | 📋 Planned |

---

### 🎱 Plugin: Quán Bida / Game

**Vấn đề đặc thù:** Tính tiền theo thời gian chơi, quản lý nhiều bàn/sân.

| Feature            | Mô tả                                                         | Status     |
| ------------------ | ------------------------------------------------------------- | ---------- |
| Time-based Billing | Tính tiền tự động theo giờ chơi (ví dụ: 30k/h), tick realtime | 📋 Planned |
| Table Timer        | Start/Stop timer cho từng bàn, hiển thị giờ đang chạy         | 📋 Planned |
| Auto Stop          | Tự động dừng tính tiền khi hết slot đặt trước                 | 📋 Planned |
| Multi-rate Pricing | Giá khác nhau theo giờ (giờ vàng, giờ thường, cuối tuần)      | 📋 Planned |
| Digital Scoreboard | Nhập điểm bi-a / bóng bàn / dart, hiển thị live trên TV       | 📋 Planned |
| Tournament Mode    | Tạo giải đấu mini, bracket tự động, leaderboard realtime      | 📋 Planned |
| Equipment Rental   | Thuê gậy, cầu lông, găng tay — tính phí riêng                 | 📋 Planned |

---

## 🚀 Extended Features (Áp dụng cho tất cả loại quán — sau v1)

### 💰 Billing nâng cao

| Feature          | Mô tả                                             | Status     |
| ---------------- | ------------------------------------------------- | ---------- |
| Smart Split Bill | Chia đều / chia theo từng người gọi món gì        | 📋 Planned |
| Loyalty Points   | Tích điểm mỗi đơn, đổi lấy món miễn phí, VIP tier | 📋 Planned |
| Digital Receipt  | Hóa đơn qua Zalo / Email / SMS                    | 📋 Planned |
| Online Payment   | QR banking (VietQR), VNPay, Momo                  | 📋 Planned |

### 🤖 AI & Smart

| Feature           | Mô tả                                           | Status     |
| ----------------- | ----------------------------------------------- | ---------- |
| Smart Upsell      | Gợi ý combo khi gọi món ("Thêm đồ nhắm không?") | 📋 Planned |
| AI Recommendation | Gợi ý món dựa trên lịch sử, filter diet         | 📋 Planned |
| Dynamic Pricing   | Happy hour tự động, flash deal khi slot cuối    | 📋 Planned |

### 🏪 Quản lý nâng cao

| Feature           | Mô tả                                        | Status     |
| ----------------- | -------------------------------------------- | ---------- |
| Inventory & Stock | Tồn kho, auto mark hết hàng, alert sắp hết   | 📋 Planned |
| Staff Scheduling  | Ca làm việc, assign khu vực, tip tracking    | 📋 Planned |
| Analytics Pro     | Revenue heatmap, customer cohort, peak hours | 📋 Planned |

### 🔧 Tech nâng cao

| Feature         | Mô tả                                        | Status     |
| --------------- | -------------------------------------------- | ---------- |
| Offline Mode    | App hoạt động khi mất mạng, sync lại sau     | 📋 Planned |
| IoT Integration | Đèn báo bàn vật lý, smart lock phòng karaoke | 📋 Planned |
| Social Sharing  | Check-in tích điểm, photo frame quán         | 📋 Planned |

---

## 🗓️ Lộ trình phát triển

### ✅ Version 1 — Core Platform

> **Mục tiêu:** 1 nền tảng base hoạt động được tại bất kỳ quán nào

```
Sprint 1 (2 tuần)         Sprint 2 (2 tuần)         Sprint 3 (2 tuần)
─────────────────         ─────────────────         ─────────────────
Auth & Role               Menu Management           Order Realtime
Venue setup               Table + QR gen            Kitchen Dashboard
DB schema                 Table status WS           Billing cơ bản
```

**Deliverable v1:** Một quán trong 3 mô hình mục tiêu (bida / cafe / karaoke) có thể vận hành end-to-end

---

### 🔜 Version 2 — Venue Plugins (sau v1 ổn định)

| Thứ tự | Plugin                                          | Lý do ưu tiên                                                |
| ------ | ----------------------------------------------- | ------------------------------------------------------------ |
| 1      | 🎱 Bida                                         | Tính tiền theo giờ là killer feature, khác biệt rõ nhất      |
| 2      | ☕ Cafe / Quán nước (gọi nước + đồ ăn)          | Nhu cầu cao, dễ rollout theo bàn/QR                          |
| 3      | 🎤 Karaoke truyền thống / Music Box / Cafe phim | Cần room/session management, triển khai sau khi core ổn định |

---

### 🔮 Version 3 — Scale & Smart

- AI features (recommendation, upsell)
- Analytics Pro
- Multi-outlet management
- IoT Integration

---

## 🏗️ Tech Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| Backend      | NestJS + TypeORM                |
| Database     | PostgreSQL                      |
| Realtime     | WebSocket (NestJS Gateway)      |
| Cache        | Redis (session, realtime state) |
| Auth         | JWT + Refresh Token             |
| Payment      | VietQR / VNPay / Momo           |
| Notification | Firebase FCM / Zalo OA          |
| Storage      | S3 / Cloudinary (ảnh món)       |
| Frontend     | (TBD)                           |
| IoT (v3)     | MQTT                            |

---

## 📊 Status Legend

| Icon           | Nghĩa           |
| -------------- | --------------- |
| 📋 Planned     | Đã lên kế hoạch |
| 🔨 In Progress | Đang phát triển |
| ✅ Done        | Hoàn thành      |
| ⏸️ On Hold     | Tạm dừng        |
| ❌ Cancelled   | Hủy             |

---

## 📝 Changelog

| Ngày       | Nội dung                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-24 | Khởi tạo roadmap, xác định core features và extended features                                                                                                             |
| 2026-04-24 | Tái cấu trúc theo kiến trúc Core Platform + Venue Plugins; thêm plugin cho Cafe, Karaoke, Bida, Nhà hàng, Sports Bar                                                      |
| 2026-04-24 | Chi tiết hoá v1: RBAC (6 roles + guest session), Customer 2 luồng (login / QR guest), Venue Management (onboarding 4 bước, zone/table, multi-venue)                       |
| 2026-04-26 | Thu hẹp phạm vi sản phẩm còn 3 mô hình: Bida, Quán nước/Cafe, Karaoke truyền thống (mở rộng Music Box/Cafe phim); bỏ ưu tiên Nhà hàng và Sports Bar khỏi roadmap hiện tại |
