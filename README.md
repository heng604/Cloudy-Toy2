# Cloudy-Toy (React + Vite)

Same shop, same UI, same features, no Next.js.

- `src/`     React app (Vite + React Router + Tailwind). Same Tailwind classes as before.
- `server/`  Small Express API for what must stay private: checkout, stock, discount codes, order e-mails (Resend), image uploads (sharp), CSV/PDF export, all admin writes.
- `shared/`  Pure logic used by both sides (pricing, discounts, delivery rules, stats, image checks...).
- `supabase/` unchanged. Run the same SQL as before. No database changes are needed.

## Run
No Supabase keys? The shop still starts and shows 6 sample products (preview only: checkout, login and admin need real keys).
Windows: double-click `start-windows.bat` (installs, opens the browser, starts the site).
Manual, from THIS folder (the one containing package.json):
1. `npm install`
2. Copy your old `.env.local` into this folder (it works as-is) or use `.env.example`.
   Vite reads `VITE_*` and the old `NEXT_PUBLIC_*` names. The server reads `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`.
3. `npm run dev`  -> site on http://localhost:3000 (API on :3001, proxied automatically)
4. Production: `npm run build` then `npm start` (serves `dist/` and `/api` on one port, `PORT` env, default 3001).

`VITE_*` values are baked in at build time, so keep `.env.local` present when you run `npm run build`.

## Supabase settings to check
Authentication > URL Configuration: keep `https://YOUR-SITE/auth/callback` in Redirect URLs (same path as before).

## Speed changes
- Products, settings and pages are fetched directly from Supabase by the browser (RLS already allows public read of active products and settings) and cached, so page changes are instant and show last data immediately while refreshing in the background.
- Data starts loading before React renders; realtime updates patch the cache without reloading pages.
- Admin, checkout, account and payment code is loaded only when visited (code splitting).
- Hashed assets are cached for a year; responses are gzip-compressed.

## Removed (they were broken or unused in the Next.js version)
`/api/payment-qr`, `/api/payment-claim`, `/api/product-image/[file]`, `/admin/discounts` (these imported functions that no longer exist), the unlinked `/faq`, `/privacy`, `/terms`, `/shipping-returns` pages (they crashed), and the unused `simulateTestPayment` action.
