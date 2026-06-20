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

> **Neon note:** Free-tier databases pause when idle. The first connection can take 10–30s.
> If seed fails with "Can't reach database server", wait 30 seconds and run `pnpm db:seed` again.

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

## Production Deployment

Recommended stack: **Neon** (PostgreSQL) + **Railway** or **Render** (API) + **Vercel** (frontend).

### Architecture

```
Browser → Vercel (Next.js) → /api/* rewrite → Railway/Render (Express API) → Neon (PostgreSQL)
```

Using the Next.js proxy (`NEXT_PUBLIC_API_URL=/api/v1`) avoids CORS issues in production.

---

### Step 1 — Neon (database)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy **pooled** `DATABASE_URL` and **direct** `DIRECT_URL` (add `&connect_timeout=30`).
3. Apply schema (one-time):

```bash
cd backend
pnpm db:generate
pnpm db:push
pnpm db:seed          # demo users for testing
```

4. Run audit migration if needed:

```bash
psql $DIRECT_URL -f migrations/001_audit_log_safe.sql
```

---

### Step 2 — Backend (Railway or Render)

#### Railway

1. New project → **Deploy from GitHub** → select this repo.
2. Set **Root Directory** to `backend`.
3. Railway reads `backend/railway.toml` automatically.
4. Add environment variables:

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon pooled URL |
| `DIRECT_URL` | Neon direct URL |
| `JWT_ACCESS_SECRET` | random 64+ chars |
| `JWT_REFRESH_SECRET` | random 64+ chars |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `CORS_ALLOW_VERCEL_PREVIEWS` | `true` |
| `LOG_LEVEL` | `info` |

5. Optional **Release Command**: `pnpm db:push`
6. Health check path: `/health`

#### Render

See **`backend/DEPLOY_RENDER.md`** for the full guide.

1. **New → Blueprint** → connect repo (uses root `render.yaml`).
2. Set `DATABASE_URL`, `DIRECT_URL`, and `CORS_ORIGIN` in the dashboard.
3. Health check path: `/health`

#### Docker (any platform)

```bash
cd backend
docker build -t corebank-api .
docker run -p 4000:4000 --env-file .env corebank-api
```

Verify: `GET https://your-api.example.com/health` → `{ "status": "ok", "database": "connected" }`

---

### Step 3 — Frontend (Vercel)

1. Import repo at [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `/api/v1` |
| `BACKEND_URL` | `https://your-api.railway.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | `CoreBank MS` |

4. Deploy. Vercel proxies `/api/*` to your backend via `next.config.ts` rewrites.

#### Alternative: direct API (no proxy)

Set `NEXT_PUBLIC_API_URL=https://your-api.railway.app/api/v1` and ensure backend `CORS_ORIGIN` matches your Vercel URL exactly.

---

### Step 4 — Post-deploy checklist

- [ ] `GET /health` returns `database: connected`
- [ ] Login works with a seeded demo user
- [ ] JWT secrets are unique (not dev defaults)
- [ ] `LOG_LEVEL=info` on backend
- [ ] Neon project is on a paid plan or accept cold-start delays on free tier

### Local production smoke test

```bash
docker compose -f docker-compose.prod.yml up --build
```

---

## Production Build (manual)

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
| `CORS_ORIGIN` | Yes | Frontend URL(s), comma-separated |
| `CORS_ALLOW_VERCEL_PREVIEWS` | No | `true` to allow `*.vercel.app` previews |
| `NODE_ENV` | No | `production` in prod |
| `PORT` | No | Default `4000` (platform may override) |
| `LOG_LEVEL` | No | Use `info` in production |

See `backend/.env.example` for full list.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `/api/v1` (Vercel proxy) or full backend URL |
| `BACKEND_URL` | Yes (proxy mode) | Backend origin for Next.js rewrites |
| `NEXT_PUBLIC_APP_URL` | Yes (prod) | Public frontend URL |
| `NEXT_PUBLIC_APP_NAME` | No | Display name |

## Project Structure

```
bankms-fullstack/
├── backend/          # Express API + Prisma (+ Dockerfile, railway.toml)
├── frontend/         # Next.js app (+ Dockerfile, vercel.json)
├── render.yaml       # Render.com blueprint
├── docker-compose.prod.yml
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
