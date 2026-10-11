-- Admin access for the artist ONLY (not "any logged-in account").
--
-- Before, every rule below allowed any logged-in user. With public sign-ups
-- possible, a stranger could create an account and edit artwork or read
-- inquiries. Now only accounts listed in admin_users can.
--
-- HOW TO RUN (Supabase > SQL Editor > New query):
--   1. Optional check, run on its own first, to see every login that exists:
--        select id, email, created_at from auth.users order by created_at;
--      Any account you don't recognise: delete it under Authentication > Users.
--   2. In STEP 1 below, replace  ARTIST_EMAIL_HERE  with Sabha's login email.
--   3. Paste this whole file and Run. If the email doesn't match a login, the
--      whole update stops with an error and nothing is changed.
-- Safe to run again (e.g. to add a second admin email).

-- ============ Who is an admin ============
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- No policies: nobody can read or change this list through the website or API.
alter table public.admin_users enable row level security;

-- STEP 1: Sabha's login email (keep the quotes).
insert into public.admin_users (user_id)
select id from auth.users where lower(email) = lower('ARTIST_EMAIL_HERE')
on conflict (user_id) do nothing;

do $$
begin
  if not exists (select 1 from public.admin_users) then
    raise exception 'No admin registered. Replace ARTIST_EMAIL_HERE with Sabha''s exact login email and run again. Nothing was changed.';
  end if;
end $$;

-- true only for a logged-in admin. Used by every rule below and by the site.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ============ Tables ============
drop policy if exists "Authenticated users manage artworks" on artworks;
drop policy if exists "Admin manages artworks" on artworks;
create policy "Admin manages artworks"
  on artworks for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users manage sizes" on artwork_sizes;
drop policy if exists "Admin manages sizes" on artwork_sizes;
create policy "Admin manages sizes"
  on artwork_sizes for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users view orders" on orders;
drop policy if exists "Admin views orders" on orders;
create policy "Admin views orders"
  on orders for select using (public.is_admin());

drop policy if exists "Authenticated users view order items" on order_items;
drop policy if exists "Admin views order items" on order_items;
create policy "Admin views order items"
  on order_items for select using (public.is_admin());

drop policy if exists "Authenticated users view inquiries" on inquiries;
drop policy if exists "Admin views inquiries" on inquiries;
create policy "Admin views inquiries"
  on inquiries for select using (public.is_admin());

drop policy if exists "Authenticated users update inquiries" on inquiries;
drop policy if exists "Admin updates inquiries" on inquiries;
create policy "Admin updates inquiries"
  on inquiries for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Authenticated users delete inquiries" on inquiries;
drop policy if exists "Admin deletes inquiries" on inquiries;
create policy "Admin deletes inquiries"
  on inquiries for delete using (public.is_admin());

drop policy if exists "Authenticated users edit site content" on site_content;
drop policy if exists "Admin edits site content" on site_content;
create policy "Admin edits site content"
  on site_content for all
  using (public.is_admin()) with check (public.is_admin());

-- ============ Storage ============
drop policy if exists "Authenticated users upload artwork images" on storage.objects;
drop policy if exists "Admin uploads artwork images" on storage.objects;
create policy "Admin uploads artwork images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'artwork-images' and public.is_admin());

drop policy if exists "Authenticated users update artwork images" on storage.objects;
drop policy if exists "Admin updates artwork images" on storage.objects;
create policy "Admin updates artwork images"
  on storage.objects for update to authenticated
  using (bucket_id = 'artwork-images' and public.is_admin());

drop policy if exists "Authenticated users delete artwork images" on storage.objects;
drop policy if exists "Admin deletes artwork images" on storage.objects;
create policy "Admin deletes artwork images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'artwork-images' and public.is_admin());

drop policy if exists "Authenticated users view artwork images" on storage.objects;
drop policy if exists "Admin lists artwork images" on storage.objects;
create policy "Admin lists artwork images"
  on storage.objects for select to authenticated
  using (bucket_id = 'artwork-images' and public.is_admin());

drop policy if exists "Authenticated users view inquiry references" on storage.objects;
drop policy if exists "Admin views inquiry references" on storage.objects;
create policy "Admin views inquiry references"
  on storage.objects for select to authenticated
  using (bucket_id = 'inquiry-references' and public.is_admin());

drop policy if exists "Authenticated users delete inquiry references" on storage.objects;
drop policy if exists "Admin deletes inquiry references" on storage.objects;
create policy "Admin deletes inquiry references"
  on storage.objects for delete to authenticated
  using (bucket_id = 'inquiry-references' and public.is_admin());
