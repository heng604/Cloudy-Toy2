-- ONE-TIME SETUP: paste all of this into Supabase Dashboard > SQL Editor > Run.
-- Phase 3 core schema + RLS. Apply with: supabase db push
create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users on delete cascade, display_name text, avatar_url text, phone text, default_shipping_address jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.admin_users(user_id uuid primary key references auth.users on delete cascade, role text not null default 'admin', created_at timestamptz default now());
create table public.categories(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, image_url text, active boolean default true, sort_order int default 0, created_at timestamptz default now());
create table public.products(id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, sku text unique not null, description text, category_id uuid references public.categories, price numeric(10,2) not null check(price>=0), sale_price numeric(10,2) check(sale_price>=0), images jsonb not null default '[]', stock int not null default 0 check(stock>=0), age_range text, specifications jsonb default '{}', active boolean default false, featured boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create index on public.products(category_id); create index on public.products(active);
create table public.orders(id uuid primary key default gen_random_uuid(), order_number text unique not null, user_id uuid not null references auth.users, customer_name text, customer_email text, customer_phone text, shipping_address jsonb, delivery_instructions text, subtotal numeric(10,2), discount numeric(10,2) default 0, shipping_fee numeric(10,2) default 0, total numeric(10,2), currency text default 'USD',
 payment_status text not null default 'PENDING' check(payment_status in('PENDING','PAID','FAILED','EXPIRED','REFUNDED')),
 fulfillment_status text not null default 'UNFULFILLED' check(fulfillment_status in('UNFULFILLED','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED')), created_at timestamptz default now(), updated_at timestamptz default now());
create table public.order_items(id uuid primary key default gen_random_uuid(), order_id uuid references public.orders on delete cascade, product_id uuid references public.products on delete set null, product_name text not null, sku text, quantity int check(quantity>0), unit_price numeric(10,2), line_total numeric(10,2));
create table public.payments(id uuid primary key default gen_random_uuid(), order_id uuid references public.orders, provider text, payment_reference text unique not null, provider_transaction_id text, amount numeric(10,2), currency text, status text default 'PENDING', verified_at timestamptz, expires_at timestamptz, metadata jsonb);
create table public.payment_events(id uuid primary key default gen_random_uuid(), provider_event_id text unique, payment_reference text, event_type text, processing_status text, received_at timestamptz default now(), processed_at timestamptz);
create table public.email_notifications(id uuid primary key default gen_random_uuid(), order_id uuid references public.orders, recipient text, notification_type text, status text default 'PENDING', attempts int default 0, sent_at timestamptz, last_error text, created_at timestamptz default now(), unique(order_id,notification_type,recipient));
create table public.inventory_reservations(id uuid primary key default gen_random_uuid(), order_id uuid references public.orders, product_id uuid references public.products, quantity int, status text default 'ACTIVE', expires_at timestamptz, created_at timestamptz default now());

create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;

alter table public.profiles enable row level security; alter table public.admin_users enable row level security; alter table public.categories enable row level security; alter table public.products enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.payments enable row level security; alter table public.payment_events enable row level security; alter table public.email_notifications enable row level security; alter table public.inventory_reservations enable row level security;

create policy "own profile read" on public.profiles for select using(id=auth.uid());
create policy "own profile update" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy "own profile insert" on public.profiles for insert with check(id=auth.uid());
create policy "public active categories" on public.categories for select using(active);
create policy "public active products" on public.products for select using(active);
create policy "own orders" on public.orders for select using(user_id=auth.uid());
create policy "own order items" on public.order_items for select using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "own payments" on public.payments for select using(exists(select 1 from public.orders o where o.id=order_id and o.user_id=auth.uid()));
create policy "admin read orders" on public.orders for select using(public.is_admin());
-- No customer INSERT/UPDATE policies on orders, payments, products, stock: writes go through trusted server code (service role) only.
-- admin_users, payment_events, email_notifications, inventory_reservations: no policies = no client access.

-- Phase 4b: permanent storage + realtime for admin data (replaces the local .data/*.json files).
-- Apply with: supabase db push   (or paste into Supabase Dashboard > SQL Editor)

-- ---- products: keep a plain-text category + readable defaults
alter table public.products add column if not exists category text not null default '';
alter table public.products alter column active set default true;

-- ---- orders: guest checkout (no login needed) + full order snapshot
alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists data jsonb;
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_email_idx on public.orders(customer_email);

-- ---- site settings (shipping fees, social links)
create table if not exists public.site_settings(key text primary key, value jsonb not null default '{}', updated_at timestamptz default now());
alter table public.site_settings enable row level security;
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);

-- ---- admin = admin_users row OR the verified admin Google account
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid())
      or (lower(coalesce(auth.jwt()->>'email','')) = 'toyscloudy@gmail.com'
          and coalesce((auth.jwt()->'user_metadata'->>'email_verified')::boolean, false))
$$;
drop policy if exists "admin read all products" on public.products;
create policy "admin read all products" on public.products for select using (public.is_admin());

-- ---- atomic stock changes (no overselling, no lost updates)
create or replace function public.decrement_stock(items jsonb) returns void language plpgsql security definer set search_path=public as $$
declare i jsonb; n int;
begin
  for i in select * from jsonb_array_elements(items) loop
    update public.products set stock = stock - (i->>'qty')::int, updated_at = now()
      where id = (i->>'productId')::uuid and stock >= (i->>'qty')::int;
    get diagnostics n = row_count;
    if n = 0 then raise exception 'INSUFFICIENT_STOCK'; end if;
  end loop;
end $$;
create or replace function public.restore_stock(items jsonb) returns void language plpgsql security definer set search_path=public as $$
declare i jsonb;
begin
  for i in select * from jsonb_array_elements(items) loop
    update public.products set stock = stock + (i->>'qty')::int, updated_at = now() where id = (i->>'productId')::uuid;
  end loop;
end $$;
revoke all on function public.decrement_stock(jsonb), public.restore_stock(jsonb) from public, anon, authenticated;
grant execute on function public.decrement_stock(jsonb), public.restore_stock(jsonb) to service_role;

-- ---- product image storage (public read; writes only by server with service role)
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
  values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do nothing;

-- ---- realtime: admin dashboard and storefront update instantly
alter publication supabase_realtime add table public.products, public.orders, public.site_settings;

-- refresh the API schema cache so new tables are visible immediately
notify pgrst, 'reload schema';

-- Discount codes: created/edited ONLY by the admin. Customers can only use a code at checkout (server checks it).
create table if not exists public.discount_codes(
  code text primary key check (code ~ '^[A-Z0-9_-]{3,30}$'),
  type text not null check (type in ('PERCENT','FIXED')),
  value numeric(10,2) not null check (value > 0),
  min_subtotal numeric(10,2) not null default 0 check (min_subtotal >= 0),
  max_uses int check (max_uses is null or max_uses > 0),
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz default now(),
  check (type <> 'PERCENT' or value <= 100)
);
alter table public.discount_codes enable row level security;
-- No customer/anon policy: codes can't be listed or guessed from the browser. Only the admin may read (for live updates).
drop policy if exists "admin read discount codes" on public.discount_codes;
create policy "admin read discount codes" on public.discount_codes for select using (public.is_admin());

-- Atomic use counter: never exceeds max_uses even with simultaneous buyers.
create or replace function public.consume_discount(p_code text) returns boolean language plpgsql security definer set search_path=public as $$
declare n int;
begin
  update public.discount_codes set used_count = used_count + 1
   where code = p_code and active and (max_uses is null or used_count < max_uses) and (expires_at is null or expires_at > now());
  get diagnostics n = row_count; return n = 1;
end $$;
create or replace function public.release_discount(p_code text) returns void language sql security definer set search_path=public as $$
  update public.discount_codes set used_count = greatest(0, used_count - 1) where code = p_code
$$;
revoke all on function public.consume_discount(text), public.release_discount(text) from public, anon, authenticated;
grant execute on function public.consume_discount(text), public.release_discount(text) to service_role;

alter publication supabase_realtime add table public.discount_codes;
notify pgrst, 'reload schema';

-- The "Age" field was removed from products.
alter table public.products drop column if exists age_range;
notify pgrst, 'reload schema';

-- Per-product discount: admin sets a % and a code on a product. Customers get that % off ONLY by typing the code at checkout;
-- without the code they pay the normal price. Kept in its own table so codes are never readable from the public products API.
create table if not exists public.product_discounts(
  product_id uuid primary key references public.products(id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9_-]{3,30}$'),
  percent numeric(5,2) not null check (percent >= 10 and percent <= 50),
  created_at timestamptz default now()
);
create index if not exists product_discounts_code_idx on public.product_discounts(code);
alter table public.product_discounts enable row level security;
drop policy if exists "admin read product discounts" on public.product_discounts;
create policy "admin read product discounts" on public.product_discounts for select using (public.is_admin());
alter publication supabase_realtime add table public.product_discounts;
notify pgrst, 'reload schema';

-- Percent discounts are limited to 10%-50%.
alter table public.product_discounts drop constraint if exists product_discounts_percent_check;
alter table public.product_discounts add constraint product_discounts_percent_check check (percent >= 10 and percent <= 50);
notify pgrst, 'reload schema';

-- Removed: Sale price and the store-wide Discounts page. Per-product discount (% + code) stays.
update public.products set sale_price = null where sale_price is not null;
drop function if exists public.consume_discount(text);
drop function if exists public.release_discount(text);
drop table if exists public.discount_codes;
notify pgrst, 'reload schema';

