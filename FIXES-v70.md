# v70: new accounts start at 0

- Membership card: the progress bar had a built-in minimum of 3%, so a brand-new account that paid $0 showed "3%". It now shows a true 0% (and the bar is empty) until something is paid. (src/components/MemberCard.tsx)
- Points: a customer who is not a member yet (nothing paid) always shows 0 points on the screen. The server already gave 0; the screen now also guards it. (src/lib/membership.ts)
- "Keep shopping" button: the plain emoji is replaced by a small drawn shopping bag with a pink heart that takes the button colour.

## Gift section (Exchange gift + My gifts)
- Redesigned: warm gift-shelf header with a "You have N pts" chip, a card per gift with a ribbon bow, points badge, a little progress bar toward the gift ("12 / 20 pts"), and a pink "ready" button once you can swap. "My gifts" is now a keepsake list with the gift picture, date, points and a coloured status (waiting / received / cancelled). (src/components/GiftExchange.tsx)
- Admin can change its background: Admin > Settings > "Exchange gift background" (picture and/or colour; a soft white layer keeps text readable). New settings: giftBackgroundImage, giftBackgroundColor. (server/app.ts slots "giftbg" / "giftcolor", src/pages/admin/Settings.tsx, shared/types.ts)
- Removed the "Profile" and "Order history" boxes from the bottom of the account page. Profile is still opened with the Edit profile button; the orders page still exists at /account/orders.

- Gift section colours changed from pink/purple to the shop's sky blue (cards, bow, points badge, progress bar, Exchange button, background). Admin colour picker default is sky blue too.
