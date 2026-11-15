# Product options (v47)

Customers can now click an option on the product page (e.g. Character: Xavier / Zayne / Rafayel / Sylus) and the choice is kept in the cart, the order, the invoice, the emails and the admin orders.

**Admin:** Products > Add/Edit Product > "Product Option / Variants". Add an option group (name + choices), press Enter after each choice. Up to 6 groups x 30 choices. No database change: options are saved as JSON in the existing `products.variants` column. Old plain text such as `Character: Xavier, Zayne` is still read and shown as clickable choices (it is converted the next time the product is saved).

**Customer:** one choice per group is required before "Add to cart". The same toy in two options is two cart lines (stock is shared). Shop cards of products with options say "Choose options" and open the product page.

**Server (`POST /api/checkout`):** each line may carry `option`; it must be exactly one valid choice from every group of that product (checked against the database, never trusted from the browser). The option is saved on the order item (`option`) and appended to the item name, e.g. `LNDS keychain (Character: Xavier)`.

Files: `shared/products.ts` (option helpers), `src/components/admin/OptionsEditor.tsx` (new), `src/pages/AddButton.tsx`, `src/components/CartProvider.tsx`, `CartView.tsx`, `CheckoutForm.tsx`, `ProductCard.tsx`, `OfferProductCard.tsx`, `server/app.ts`, `tests/options.test.ts` (new).

## Option photos (v48)

Admin: in the option editor, every choice has a small photo button. Click it, then click one of the product's photos to link it (or "No photo"). Links are saved inside the same `variants` JSON (`images: { "Xavier": "<photo>" }`), so there is still no database change. If a photo is removed from the product, its links are dropped on save.

Customer: choices with a photo show a small round thumbnail; clicking the choice jumps the big gallery to that photo. The cart line shows the photo of the chosen option.

Note: photos uploaded in the same editing session must be saved first, then edit the product again to link them (the link uses the saved photo).

Files: `shared/products.ts`, `OptionsEditor.tsx`, `ProductModal.tsx`, `ProductGallery.tsx`, `AddButton.tsx`, `ProductPage.tsx`, `CartView.tsx`, `server/app.ts`, `tests/options.test.ts`.
