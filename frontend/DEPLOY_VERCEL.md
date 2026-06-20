# Deploy CoreBank Frontend on Vercel

Backend API (already deployed): **https://bankms-fullstack-2.onrender.com**

## How it works

```
Browser → your-app.vercel.app/api/v1/* → Vercel rewrite → Render backend
```

The browser uses same-origin `/api/v1` — no CORS configuration needed on the backend for normal usage.

---

## Step 1 — Push code to GitHub

Ensure latest frontend changes are committed and pushed.

## Step 2 — Import project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `bankms-fullstack` GitHub repository
3. Configure:

| Setting | Value |
|---------|--------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `pnpm build` (default from `vercel.json`) |
| **Install Command** | `pnpm install --frozen-lockfile` |

## Step 3 — Environment variables

Add these in Vercel → Project → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|--------|--------------|
| `NEXT_PUBLIC_API_URL` | `/api/v1` | Production, Preview, Development |
| `BACKEND_URL` | `https://bankms-fullstack-2.onrender.com` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` | Production |
| `NEXT_PUBLIC_APP_NAME` | `CoreBank MS` | All |

> **Tip:** After the first deploy, copy your actual Vercel URL into `NEXT_PUBLIC_APP_URL` and redeploy.

Preview deployments can use the auto-generated preview URL — `next.config.ts` falls back to `VERCEL_URL` when `NEXT_PUBLIC_APP_URL` is unset.

## Step 4 — Deploy

Click **Deploy**. First build takes ~2–5 minutes.

## Step 5 — Verify

1. Open `https://YOUR-PROJECT.vercel.app/login`
2. Log in with `abebe.girma` / `Password123!`
3. First login may take **30–60 seconds** while Render wakes from sleep (free tier)

### Quick API test (via Vercel proxy)

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"abebe.girma","password":"Password123!"}'
```

---

## Optional — Update Render backend env

If you later switch to **direct API calls** (without proxy), set on Render:

```
CORS_ORIGIN=https://YOUR-PROJECT.vercel.app
CORS_ALLOW_VERCEL_PREVIEWS=true
```

With proxy mode (recommended), this is not required.

Also set on Render for production hygiene:

```
NODE_ENV=production
LOG_LEVEL=info
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on pnpm lockfile | Run `pnpm install --lockfile-only` in `frontend/` and commit |
| Network Error / timeout on login | Render cold start — wait 60s and retry; API timeout is 90s in prod |
| 404 on `/api/v1/*` | Check `BACKEND_URL` env var on Vercel |
| Login works locally but not on Vercel | Confirm Root Directory is `frontend` and env vars are set |

---

## Local dev with production backend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=/api/v1
BACKEND_URL=https://bankms-fullstack-2.onrender.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then `pnpm dev` — requests proxy to Render via Next.js rewrites.
