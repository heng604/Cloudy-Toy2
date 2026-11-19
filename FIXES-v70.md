# v70: new accounts start at 0

- Membership card: the progress bar had a built-in minimum of 3%, so a brand-new account that paid $0 showed "3%". It now shows a true 0% (and the bar is empty) until something is paid. (src/components/MemberCard.tsx)
- Points: a customer who is not a member yet (nothing paid) always shows 0 points on the screen. The server already gave 0; the screen now also guards it. (src/lib/membership.ts)
- "Keep shopping" button: the plain emoji is replaced by a small drawn shopping bag with a pink heart that takes the button colour.
