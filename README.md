# MyPainter — Richo Petersen

Simple HTML site for Richard "Richo" Petersen — painter and handyman based in Glenbervie, Whangarei.

## Stack
- HTML + CSS + Cloudflare Pages Functions
- D1 database (quotes, gallery, editable page text)
- R2 bucket (gallery photo uploads)
- Formspree for contact form

## Admin (login + inline edits + gallery)
- **Login:** https://mypainter.co.nz/admin/
- **Gallery folders:** https://mypainter.co.nz/admin/gallery.html
- When logged in, a toolbar appears on public pages for inline text edits

### One-time Cloudflare setup
1. Create D1 database `mypainter-quotes` and paste IDs into `wrangler.toml`
2. Run migrations: `wrangler d1 execute mypainter-quotes --remote --file=migrations/0001_quotes.sql` then `0002_cms.sql`
3. Create R2 bucket `mypainter-gallery` and bind as `GALLERY` in Pages settings
4. Bind D1 as `DB` in Pages settings
5. Set env vars: `ADMIN_PASSWORD`, optional `SESSION_SECRET`

## Live site
https://mypainter.co.nz

## Local preview
No build step. For correct `/` paths (CSS and nav), serve the project folder — for example `python3 -m http.server 8080` — then open http://localhost:8080/

## Adding photos
Drop images into /images/ folder, then update the `<img>` src in HTML.

## Swapping contact form provider
Current: Formspree (50 submissions/month free).
Replace the form action URL in contact.html.

## Deployed by
Cloudflare Pages, watching the main branch of GitHub repo.
