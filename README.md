# 🏦 Simple Banking App

Ứng dụng ngân hàng trực tuyến cơ bản, hỗ trợ quản lý tài khoản, chuyển khoản nội bộ, xem lịch sử giao dịch và thông báo thời gian thực.

---

## 📋 Mục lục

- [Tech Stack](#tech-stack)
- [Tính năng](#tính-năng)
- [Cài đặt & Chạy](#cài-đặt--chạy)
- [Biến môi trường](#biến-môi-trường)
- [API Endpoints](#api-endpoints)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Bảo mật](#bảo-mật)

---

## Tech Stack

| Lớp | Công nghệ |
|---|---|
| Backend | NestJS (TypeScript) |
| ORM | TypeORM |
| Database | PostgreSQL |
| Frontend | ReactJS + TypeScript + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| HTTP Client | Axios |
| Auth | JWT (Access Token) |

---

## Tính năng

### Customer
- ✅ Đăng ký / Đăng nhập bằng email + mật khẩu
- ✅ Xem thông tin tài khoản ngân hàng & số dư
- ✅ Chuyển khoản nội bộ (có màn xác nhận, chống double-submit)
- ✅ Xem lịch sử giao dịch (phân trang, lọc tiền vào/ra)
- ✅ Đăng xuất

### Admin
- ✅ Xem danh sách người dùng (tìm kiếm, lọc theo trạng thái)
- ✅ Khóa / Mở khóa tài khoản người dùng

---

## Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- npm >= 9

### 1. Clone repo

```bash
git clone <repo-url>
cd banking-app
```

### 2. Khởi động Database
 Tạo PostgreSQL tại `localhost:5432`.

### 3. Cài đặt & chạy Backend

```bash
cd backend
npm install
cp .env.example .env   # Điền các biến môi trường
npm run start:dev
```

Backend chạy tại: `http://localhost:3000`

### 4. Cài đặt & chạy Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Điền VITE_API_URL
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

### 5. Seed tài khoản (lần đầu)

Sau khi backend và frontend đã chạy: 
Tao tài khoản ở trang đăng ký ([localhoas](http://localhost:5173/register)
|Vai trò | Tài khoản | Mật khẩu |
|---|---|---|
| Customer| a@test.com | 123456 |
| Customer| b@test.com | 123456 |
| Admin | admin@test.com | 123456 |

**Lưu ý**: Tạo tài khoản admin bằng cách chạy query trong pgAdmin:

```sql
-- Đăng ký tài khoản bình thường trước, sau đó nâng quyền:
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## Biến môi trường

### Backend — `backend/.env`

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/banking_db

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=1d

# App
PORT=3000
```

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

> Xem file `.env.example` trong mỗi thư mục để biết đầy đủ các biến cần thiết.

---

## API Endpoints

### Auth
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/auth/register` | Đăng ký tài khoản | ❌ |
| POST | `/auth/login` | Đăng nhập, trả JWT | ❌ |

### Accounts
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/accounts/me` | Thông tin & số dư tài khoản | ✅ |

### Transactions
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/transactions/transfer` | Chuyển khoản nội bộ | ✅ |
| GET | `/transactions` | Lịch sử giao dịch (phân trang, lọc) | ✅ |

**Query params cho `GET /transactions`:**
```
page        số trang (default: 1)
limit       số bản ghi mỗi trang (default: 10)
direction   all | sent | received
type        transfer | deposit | withdrawal
```

### Admin
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/admin/users` | Danh sách người dùng | ✅ Admin |
| PATCH | `/admin/users/:id/status` | Khóa / Mở tài khoản | ✅ Admin |

**Query params cho `GET /admin/users`:**
```
page    số trang (default: 1)
limit   số bản ghi mỗi trang (default: 10)
status  active | locked
role    customer | admin
search  tìm theo tên hoặc email
```

---

## Cấu trúc thư mục

### Backend
```
backend/src/
├── auth/                   # Đăng nhập, đăng ký, JWT, Guards
│   ├── decorators/         # @CurrentUser, @Roles
│   ├── guards/             # RolesGuard
│   └── dto/
├── users/                  # UsersService (truy vấn user)
├── accounts/               # Thông tin tài khoản ngân hàng
├── admin/                  # Quản lý người dùng (admin only)
└── main.ts
```

### Frontend
```
frontend/src/
├── api/                    # Axios instance + interceptors
├── components/
│   ├── common/             # Button, InputField, Spinner, ...
│   ├── sidebar/            # Sidebar, NavItems, NotificationBell
│   └── transfer/           # Form, Confirm, Success screens
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── Dashboard/          # Xem tài khoản & số dư
│   ├── Transfer/           # Chuyển khoản
│   ├── History/            # Lịch sử giao dịch
│   └── Admin/              # Quản lý users (admin only)
├── services/               # Gọi REST API
├── store/                  # Zustand (auth state)
└── types/                  # TypeScript interfaces
```

---

## Bảo mật

- **Password:** Hash bằng `bcrypt` (saltRounds = 10), không lưu plaintext.
- **JWT:** Token có thời hạn, không trả `password_hash` trong response.
- **Authorization:** `JwtAuthGuard` bảo vệ toàn bộ route cần xác thực. `RolesGuard` + `@Roles(admin)` bảo vệ route admin.
- **Data isolation:** User chỉ truy cập được dữ liệu của chính mình (query theo `userId` từ JWT, không nhận `id` từ client).
- **Transfer validation:** Kiểm tra số dư, chặn tự chuyển, chặn tài khoản bị khóa, validate số tiền chặt chẽ.
- **Database transaction:** Toàn bộ thao tác chuyển khoản nằm trong 1 DB transaction — rollback toàn bộ nếu có lỗi.
- **Pessimistic locking:** `SELECT ... FOR UPDATE` khi đọc balance để tránh race condition.
- **Idempotency key:** Chống double-submit khi người dùng bấm nút nhiều lần.
- **Input validation:** `class-validator` + `ValidationPipe` global — loại bỏ field lạ, validate toàn bộ input.
- **CORS:** Cấu hình explicit, secret/keys đặt trong `.env`, không commit.

---

## Tác giả
MT Quang Nhật - [GITHUB (quangnhat09z)](https://github.com/quangnhat09z/).  
Dự án thực tập — Simple Banking App  
Stack: NestJS · ReactJS · PostgreSQL · TypeORM 

