-- Points gift exchange: the gifts members can redeem with points, and every redemption (so the admin can hand the gift over and mark it claimed).
create table if not exists public.gifts(
  id text primary key,
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '',
  points int not null check (points > 0),
  was_points int check (was_points is null or was_points > 0),
  stock int not null default 0 check (stock >= 0),
  image text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.gift_redemptions(
  id text primary key,
  email text not null,
  customer_name text not null default '',
  gift_id text not null,
  gift_name text not null,
  gift_image text not null default '',
  points int not null check (points > 0),
  status text not null default 'PENDING' check (status in ('PENDING','CLAIMED','CANCELLED')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists gift_redemptions_email_idx on public.gift_redemptions(lower(email));
alter table public.gifts enable row level security;
alter table public.gift_redemptions enable row level security;
drop policy if exists "admin read gifts" on public.gifts;
create policy "admin read gifts" on public.gifts for select using (public.is_admin());
drop policy if exists "admin read gift redemptions" on public.gift_redemptions;
create policy "admin read gift redemptions" on public.gift_redemptions for select using (public.is_admin());
notify pgrst, 'reload schema';
