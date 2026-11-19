# v69: friendlier English + more Khmer

## What changed
- **More personal English** on the customer pages (cart, checkout, payment, sign-in, membership, gifts, product page, 404). Short and warm, like a shop owner talking to a friend. Examples: "Got a discount code?", "Anything we should know for delivery?", "Your cart is empty. Let's fill it with something cute!", "Hi, welcome to Cloudy Toys!".
- **About 320 more Khmer translations** in `src/lib/km-extra.ts`. Pages that had English text that did not change when KH was clicked now switch fully:
  - Bakong KHQR page and the "Payment successful" popup
  - Payment / order page (breakdown, pre-order notes, cash on delivery note)
  - Cart and checkout (placeholders, payment methods, pre-order deposit, errors)
  - Sign-in / create account form, 404 page, product page, Add to cart
  - Gift exchange, points wallet, membership texts
  - Admin: Membership page, Gifts catalog, reports, error messages
- Text that was written straight into the page (not through `t()`) is now wrapped, so it can be translated.

## Not changed on purpose
- The printed invoice / receipt layout (`Invoice.tsx`, `Receipt.tsx`) and the emails from the server stay English.
- Text the admin types (page content, product names, offer text) is shown as the admin wrote it.
