-- Customer profile: photo + contact info the customer can edit, and the account email so the admin can see it on Membership.
-- (profiles.avatar_url, display_name and phone already exist.)
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists facebook text;
alter table public.profiles add column if not exists telegram text;
create index if not exists profiles_email_idx on public.profiles(lower(email));
update public.profiles p set email = lower(u.email) from auth.users u where u.id = p.id and p.email is null;
-- new sign-ups get their email in the profile too
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, display_name, phone)
  values (new.id, lower(new.email), coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)), nullif(new.raw_user_meta_data->>'phone', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
notify pgrst, 'reload schema';
