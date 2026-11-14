-- Promo code use limits (admin sets them on Promotions > Promo codes). Both are optional: null = no limit.
alter table public.store_discounts add column if not exists max_uses int check (max_uses is null or max_uses > 0);
alter table public.store_discounts add column if not exists per_customer int check (per_customer is null or per_customer > 0);
notify pgrst, 'reload schema';
