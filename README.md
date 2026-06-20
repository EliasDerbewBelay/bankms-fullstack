# CoreBank MS — Bank Management System

Full-stack enterprise banking platform built with **Next.js 16**, **Express 5**, **PostgreSQL**, and **Prisma**.

## Features

- Role-based access: Customer, Teller, Supervisor, Branch Manager, Admin
- Accounts, transactions, interbank transfers, loans, cards, ATM, refunds
- Immutable audit log (append-only at DB level)
- Real-time dashboards with Recharts (data from PostgreSQL)
- JWT auth, 2FA (TOTP), rate limiting, KYC enforcement

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | Next.js 16, React 19, Tailwind, TanStack Query, Recharts |
| Backend | Express 5, TypeScript, Prisma, Argon2, Zod |
| Database | PostgreSQL |

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

## Quick Start (Development)

### 1. Clone & install

```bash
git clone https://github.com/EliasDerbewBelay/bankms-fullstack.git
cd bankms-fullstack

cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Database

Create a PostgreSQL database, then configure the backend:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, DIRECT_URL, JWT secrets (min 32 chars)
```

Apply schema (choose one):

```bash
# Option A: Prisma push (dev)
cd backend && pnpm db:generate && npx prisma db push

# Option B: Run root schema + audit migration
psql -U postgres -d bankdb -f schema.sql
psql -U postgres -d bankdb -f backend/migrations/001_audit_log_safe.sql
```

Seed demo data (required for login on a fresh database):

```bash
cd backend
pnpm db:seed
# Creates org, 9 demo users, accounts, sample transactions
# Password for all demo users: Password123!
```

Optional:

```bash
pnpm seed:banks              # Ethiopian commercial banks (interbank transfers)
pnpm seed:reset-passwords    # Re-hash passwords only (users must already exist)
```

### 3. Frontend env

```bash
cp frontend/.env.example frontend/.env.local
```

### 4. Run

```bash
# Terminal 1 — API (port 4000)
cd backend && pnpm dev

# Terminal 2 — UI (port 3000)
cd frontend && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Demo credentials are shown on the login page (password: `Password123!` after running `pnpm db:seed`).

## Production Build

### Backend

```bash
cd backend
cp .env.example .env   # configure production values
pnpm install --frozen-lockfile
pnpm db:generate
pnpm build
NODE_ENV=production pnpm start
```

Health check: `GET /health`

### Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
# BACKEND_URL=https://api.yourdomain.com
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct DB URL (Prisma migrations) |
| `JWT_ACCESS_SECRET` | Yes | Min 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Min 32 characters |
| `CORS_ORIGIN` | Yes | Frontend URL (e.g. `https://app.example.com`) |
| `NODE_ENV` | No | `production` in prod |
| `PORT` | No | Default `4000` |

See `backend/.env.example` for full list.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Public API base URL |
| `BACKEND_URL` | No | Used by Next.js rewrites |

## Project Structure

```
bankms-fullstack/
├── backend/          # Express API + Prisma
├── frontend/         # Next.js app
├── schema.sql        # Full PostgreSQL schema reference
├── DATABASE_SCHEMA.md
└── README.md
```

## Security Notes

- Never commit `.env` files (see `.gitignore`)
- Audit logs are append-only (DB rules + triggers)
- Passwords hashed with Argon2; sensitive fields stripped from audit logs
- Use strong JWT secrets and HTTPS in production

## License

Private / educational use — CoreBank MS project.
