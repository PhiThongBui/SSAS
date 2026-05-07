# Restaurant — Project Roadmap

> **Cập nhật lần cuối:** 2026-05-05
> **Phạm vi:** Hệ thống vận hành **một quán ăn** — gọi món qua QR tại bàn

---

## Vision

Khách ngồi xuống, scan QR tại bàn và chọn 1 trong 2 hình thức:

- **Combo / Buffet** — trả một lần cố định, gọi các món nằm trong combo đó (có hoặc không giới hạn số lượng theo combo)
- **Gọi món (Per item)** — gọi món nào tính tiền món đó

Cùng một bàn có thể vừa mua combo vừa gọi thêm món ngoài combo. Bếp nhận đơn realtime. Thu ngân xuất bill cuối phiên.

---

## Roles

| Role        | Mô tả                                                               |
| ----------- | ------------------------------------------------------------------- |
| `owner`     | Toàn quyền: quản lý nhân viên, menu, combo, báo cáo                 |
| `manager`   | Quản lý menu, combo, bàn — không xóa tài khoản staff                |
| `cashier`   | Tạo / đóng bill, xử lý thanh toán                                   |
| `waiter`    | Tạo order thay khách, cập nhật trạng thái bàn                       |
| `kitchen`   | Xem KDS, cập nhật trạng thái món                                    |

---

## Phase 1 — Core (MVP)

### Auth

#### 1. Đăng nhập staff
- [ ] Nhận `username` + `password`, xác thực với database
- [ ] Trả về `access_token` (JWT, hết hạn 15 phút) + `refresh_token` (hết hạn 7 ngày)
- [ ] `refresh_token` được hash trước khi lưu vào database

#### 2. Refresh token
- [ ] Nhận `refresh_token` từ client
- [ ] Kiểm tra token tồn tại trong DB
- [ ] Kiểm tra token chưa hết hạn (`expires_at > now`)
- [ ] Cấp `access_token` mới (JWT 15 phút), giữ nguyên `refresh_token` cũ

#### 3. Logout
- [ ] Nhận `refresh_token`, đánh dấu thu hồi trong database
- [ ] `access_token` còn lại tự hết hạn sau 15 phút (không cần blacklist)

#### 4. Phân quyền theo role
- [ ] Mỗi API được gắn nhãn role được phép truy cập (owner / manager / cashier / waiter / kitchen)
- [ ] Request không có token → 401
- [ ] Request có token nhưng sai role → 403
- [ ] Một user có thể có nhiều role cùng lúc

#### 5. Guest session (khách scan QR)
- [ ] Khách scan QR tại bàn → hệ thống tạo `guest_session` tự động, không cần tài khoản
- [ ] Trả về `guest_token` cho khách lưu tạm (dùng để gọi món)
- [ ] `guest_token` hết hạn sau 4 tiếng hoặc khi bill được thanh toán

#### 6. Quản lý tài khoản staff (chỉ owner)
- [ ] Owner tạo tài khoản staff mới (username, mật khẩu, role)
- [ ] Owner vô hiệu hoá tài khoản staff (`is_active = false`)

### Bàn & QR

- [ ] CRUD bàn: tên, sức chứa, trạng thái
- [ ] Mỗi bàn có QR riêng (generate + tải về in)
- [ ] Trạng thái bàn realtime: Available · Occupied · Reserved · Disabled

### Menu

- [ ] CRUD danh mục và món: tên, ảnh, giá, mô tả
- [ ] Bật / tắt món (hết hàng trong ngày)
- [ ] Tag: best seller, mới, khuyến mãi

### Combo / Buffet

- [ ] CRUD combo: tên, giá, mô tả, thời gian hiệu lực (VD: 2 tiếng)
- [ ] Gán món vào combo + giới hạn số lượng mỗi món (null = không giới hạn)
- [ ] Bật / tắt combo
- [ ] Khi khách chọn combo tại bàn: ghi nhận số người mua combo

### Order Realtime

**Luồng combo:**
- [ ] Khách mua combo → app hiển thị đúng danh sách món được gọi trong combo
- [ ] Gọi món trong combo → không tính tiền thêm (trừ khi vượt giới hạn)
- [ ] Khi gọi vượt giới hạn → tự động chuyển sang tính tiền à la carte

**Luồng per item:**
- [ ] Gọi món bất kỳ trong menu → tính tiền từng món

**Chung:**
- [ ] WebSocket đẩy đơn về bếp ngay lập tức
- [ ] Trạng thái: `Pending → Confirmed → Cooking → Served`
- [ ] Khách theo dõi trạng thái realtime
- [ ] Nhân viên tạo order thay khách

### Kitchen Display (KDS)

- [ ] Nhận đơn mới realtime, hiển thị bàn + ghi chú
- [ ] Bấm đổi trạng thái từng món / đơn
- [ ] Cảnh báo đơn chờ quá 10 phút

### Billing

- [ ] Bill tổng hợp: combo đã mua + món à la carte + món vượt giới hạn combo
- [ ] Hiển thị rõ từng phần trên bill
- [ ] In / xuất bill (PDF hoặc in nhiệt)
- [ ] Thanh toán: tiền mặt / chuyển khoản / QR banking

### Gọi nhân viên

- [ ] Khách bấm 1 nút từ QR: gọi thêm đá, dọn bàn, yêu cầu bill
- [ ] Nhân viên nhận alert realtime

---

## Phase 2 — Nâng cao

- [ ] Báo cáo doanh thu: ngày / tuần / tháng, top món, hiệu quả combo
- [ ] Tồn kho nguyên liệu + alert sắp hết
- [ ] Giảm giá / voucher trên bill
- [ ] Lịch sử order + tích điểm cho khách đăng ký tài khoản
- [ ] Thanh toán online: VNPay / Momo

---

## Tech Stack

| Layer    | Công nghệ                   |
| -------- | --------------------------- |
| Backend  | NestJS + TypeORM            |
| Database | MySQL 8                     |
| Realtime | WebSocket (NestJS Gateway)  |
| Cache    | Redis                       |
| Auth     | JWT + Refresh Token         |
| Storage  | Cloudinary (ảnh món)        |
| Payment  | VietQR / VNPay / Momo       |

---

## Changelog

| Ngày       | Nội dung                                                              |
| ---------- | --------------------------------------------------------------------- |
| 2026-05-05 | Khởi tạo roadmap cho quán ăn gọi món qua QR                          |
| 2026-05-05 | Thêm mô hình combo/buffet + à la carte trong cùng một phiên bàn      |
| 2026-05-06 | Mở rộng kế hoạch Auth: 6 nhóm tính năng chi tiết                     |
