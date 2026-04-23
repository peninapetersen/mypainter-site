# MyPainter — Richo Petersen

Simple HTML site for Richard "Richo" Petersen — painter and handyman based in Glenbervie, Whangarei.

## Stack
- Pure HTML + CSS (no framework, no build)
- Hosted on Cloudflare Pages (free)
- Formspree for contact form

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
