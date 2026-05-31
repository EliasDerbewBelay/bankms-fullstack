# Bank Management System — Setup Guide

## Prerequisites
- Node.js v20+ 
- pnpm v9+
- PostgreSQL running on port 5433 with `bankdb` database
- Redis on port 6379 (optional — remove BullMQ/ioredis if not needed immediately)

---

## Backend Setup

```bash
cd backend

# Install all dependencies
pnpm install

# Generate Prisma client from your existing bankdb
pnpm db:generate

# Start development server
pnpm dev
```

**Verify:** `http://localhost:4000/health` → `{"status":"ok"}`

---

## Frontend Setup

```bash
cd frontend

# Install all dependencies
pnpm install

# Start development server
pnpm dev
```

**Verify:** Open `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | Public | Login |
| POST | `/api/v1/auth/refresh` | Public | Refresh token |
| POST | `/api/v1/auth/logout` | JWT | Logout |
| GET | `/api/v1/auth/me` | JWT | Current user |
| GET | `/api/v1/customers` | TELLER+ | List customers |
| POST | `/api/v1/customers` | TELLER+ | Create customer |
| GET | `/api/v1/accounts/my` | CUSTOMER | My accounts |
| GET | `/api/v1/accounts` | TELLER+ | All accounts |
| POST | `/api/v1/transactions/deposit` | TELLER+ | Deposit |
| POST | `/api/v1/transactions/withdraw` | TELLER+ | Withdraw |
| POST | `/api/v1/transactions/transfer` | CUSTOMER+ | Transfer |
| GET | `/api/v1/loans` | TELLER+ | All loans |
| POST | `/api/v1/loans/applications` | CUSTOMER+ | Apply |
| GET | `/api/v1/admin/dashboard` | MANAGER+ | Dashboard stats |
| GET | `/api/v1/admin/audit-logs` | MANAGER+ | Audit logs |

---

## Folder Structure

```
your-repo/
├── backend/
│   ├── prisma/schema.prisma      ← Prisma schema (34 tables)
│   ├── src/
│   │   ├── app.ts                ← Express app
│   │   ├── server.ts             ← Entry point
│   │   ├── config/               ← DB, env, logger, redis
│   │   ├── middleware/           ← auth, RBAC, validation, rate limiting
│   │   ├── modules/              ← auth, customers, accounts, transactions, loans, admin
│   │   └── utils/                ← ApiError, ApiResponse, asyncHandler, pagination
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                  ← Next.js App Router pages
│   │   │   ├── (auth)/login/     ← Login page
│   │   │   └── (dashboard)/      ← Protected pages
│   │   ├── components/           ← UI components, sidebar, providers
│   │   ├── lib/                  ← api client, utils
│   │   └── store/                ← Zustand auth store
│   └── package.json
├── schema.sql                    ← Your complete database schema
└── README.md
```

---

## Notes

- The Prisma `schema.prisma` is pre-written from your 34-table design.
  Run `pnpm db:generate` (not `db:pull`) since the schema is already correct.
- All passwords in the database are placeholder hashes — update them using
  real Argon2id hashes before testing login.
- Redis is used for rate limiting and BullMQ. If Redis is not running,
  comment out the Redis-backed rate limiter in `src/middleware/rateLimiter.ts`
  and replace with the in-memory version: `store: undefined` (default).
