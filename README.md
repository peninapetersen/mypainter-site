# MyPainter — Richo Petersen

Public marketing site + business app for Richard "Richo" Petersen, Whangarei NZ.

## Live

- **Public site:** https://mypainter.co.nz
- **Business app:** https://mypainter.co.nz/app/login
- **Legacy admin (gallery / inline edits):** https://mypainter.co.nz/admin/

## Stack

| Layer | Tech |
|-------|------|
| Public pages | HTML + CSS on Cloudflare Pages |
| Business app `/app/*` | React + Vite + Tailwind + Supabase Auth |
| Legacy admin | Cloudflare D1 + R2 + Pages Functions |
| Database (app) | Supabase **My Sites** project `jkampxliebnzsevvmqre` |

## One-time Supabase setup (Phase 1)

1. Open [SQL editor](https://supabase.com/dashboard/project/jkampxliebnzsevvmqre/sql)
2. Run [`supabase/migrations/001_mypainter_foundation.sql`](supabase/migrations/001_mypainter_foundation.sql)
3. **Authentication → Users** — create Richo's login (email + password)
4. **Storage** — create buckets `mypainter-gallery`, `mypainter-receipts` (private; RLS in Phase 2)

## Cloudflare Pages env vars

Set in Pages project → Settings → Environment variables (Production):

```
VITE_SUPABASE_URL=https://jkampxliebnzsevvmqre.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase API settings>
```

Legacy admin still uses: `ADMIN_PASSWORD`, D1 `DB`, R2 `GALLERY`.

## Build & deploy

```bash
npm install
npm run build          # outputs dist/ (static site + /app SPA)
git push origin main   # Cloudflare auto-deploys from main
```

**Build command on Cloudflare:** `npm run build`  
**Output directory:** `dist`

## Local dev (business app only)

```bash
cp .env.example .env.local   # add your anon key
npm install
npm run dev                  # Vite on :5173 — use /app/ paths
```

## Docs

- [`docs/schema.md`](docs/schema.md) — full `mp_*` table column lists
