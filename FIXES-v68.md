# v68 fixes

## Bugs fixed
- **Checkout failed for every payment method (pay with delivery, Bakong, QR).** In `server/app.ts` a `//` comment swallowed the `const freeShip = ...` line, so the order crashed and showed "Could not place the order". Fixed. This was also why the Bakong KHQR page never opened and the admin never got the order email.
- **New customer saw "3 points" before paying.** The cart/checkout points box showed a preview (+3 pts / New balance 3). Now a customer who has not paid anything sees `0 pts` and a friendly note. Real points still come only from PAID orders.
- Pay with delivery: after checkout a thank-you popup appears, then the customer goes back to the home page (admin + customer emails are sent by the server).
- Other errors found by the type checker and fixed: duplicate `Line` name in CartView, duplicate Khmer key "Change picture", Pages.tsx delete button, Settings.tsx impossible comparison, `seen` null in Bakong status. Two old PDF tests updated.

## New
- **Level description:** Admin > Membership > edit a level > "Level description" (up to 1000 characters, several lines). Customers read it on their membership page and the level cards. No database change.
- **Gift exchange receipt:** when a member exchanges points, an email receipt goes to the admin (gift, points, customer name/phone/address/Telegram) and a friendly copy to the customer. Needs `RESEND_API_KEY` like the order emails.
- **Points for a shop product:** Admin > Membership > Gifts > "Give a shop product as the gift" fills the gift name and photo from a product.
- Friendlier English on the membership, gift and checkout messages (Khmer keys updated to match).
