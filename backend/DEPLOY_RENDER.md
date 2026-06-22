# Deploy CoreBank API on Render

## Prerequisites

- GitHub repo pushed with latest code
- [Neon](https://neon.tech) PostgreSQL project with schema applied (`pnpm db:push`) and demo data seeded (`pnpm db:seed`)

## Option A — Blueprint (recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint**
2. Connect GitHub and select this repository
3. Render reads `render.yaml` at the repo root
4. In the dashboard, set these **secret** env vars when prompted:
   - `DATABASE_URL` — Neon **pooled** URL (`-pooler` in hostname)
   - `DIRECT_URL` — Neon **direct** URL (no `-pooler`)
   - `CORS_ORIGIN` — your frontend URL (e.g. `https://your-app.vercel.app`; use `http://localhost:3000` until frontend is deployed)
5. Click **Apply** and wait for the first deploy (~5–10 min)

## Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Build Command | `corepack enable && corepack prepare pnpm@9 --activate && pnpm install --frozen-lockfile && pnpm run render-build` |
| Start Command | `pnpm start` |
| Pre-Deploy Command | `pnpm db:deploy` |
| Health Check Path | `/health` |

### Required environment variables

| Variable | Example |
|----------|---------|
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `DATABASE_URL` | `postgresql://...@ep-xxx-pooler...neon.tech/neondb?sslmode=require&connect_timeout=30` |
| `DIRECT_URL` | `postgresql://...@ep-xxx...neon.tech/neondb?sslmode=require&connect_timeout=30` |
| `JWT_ACCESS_SECRET` | 64+ random characters |
| `JWT_REFRESH_SECRET` | 64+ random characters (different from access) |
| `CORS_ORIGIN` | `https://bankms-fullstack.vercel.app,http://localhost:3000` (no quotes) |
| `CORS_ALLOW_VERCEL_PREVIEWS` | `true` |
| `CORS_ALLOW_VERCEL_PREVIEWS` | `true` |

**Do not set `PORT`** — Render injects it automatically.

**Redis is not required** — the app does not use it.

## Verify deployment

```bash
# Root info
curl https://YOUR-SERVICE.onrender.com/

# Health (must show database: connected)
curl https://YOUR-SERVICE.onrender.com/health

# Login test
curl -X POST https://YOUR-SERVICE.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"abebe.girma","password":"Password123!"}'
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `pnpm` | Ensure `backend/pnpm-lock.yaml` is committed |
| `Can't reach database server` | Check Neon URLs; add `connect_timeout=30`; wake DB in Neon console |
| Health check timeout | First deploy on free tier can take 60s+; retry |
| `401` on login | Run `pnpm db:seed` locally against Neon |
| CORS errors | Set `CORS_ORIGIN` to exact frontend origin |

## Save for frontend deploy

Your API base URL:

```
https://YOUR-SERVICE.onrender.com
```

Use as `BACKEND_URL` when deploying the Next.js frontend on Vercel.
