# Special Offer (festival / event) - what changed

Admin: Promotions > Automatic Discounts > + Add Campaign > type "Special Offer: % off chosen products".
- Tick the products (search box + "Tick all shown").
- Write the festival promotion text (English + optional Khmer).
- Optional start / end dates (empty = on until you pause it).
Customers: the "Special Offer" button (/shop?sale=1) now lists the chosen products with the new price,
shows the festival name + your text, and the discount is applied at checkout (server recomputes it).
The text also appears on the Home page and on each product page.

Files: shared/promotions.ts, server/app.ts, src/pages/admin/Discounts.tsx, src/pages/Shop.tsx,
src/pages/Home.tsx, src/pages/ProductPage.tsx, src/components/CartView.tsx, src/components/CheckoutForm.tsx,
tests/promotions.test.ts. No SQL migration needed (stored in site_settings "promotions").
