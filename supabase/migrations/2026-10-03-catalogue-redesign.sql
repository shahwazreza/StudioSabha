-- "The Catalogue" redesign. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Additive only: adds columns, a storage bucket and permissions. Existing
-- artwork, orders and inquiries are not changed or removed, except that
-- existing pieces are given catalogue numbers. Safe to run again.

-- ============ ARTWORKS: catalogue number, edition, signed ============
alter table artworks add column if not exists catalogue_number integer;
alter table artworks add column if not exists edition text;
alter table artworks add column if not exists signed boolean not null default false;

-- Number existing pieces in their current shop order (newest first = 01).
with ordered as (
  select id, row_number() over (order by created_at desc) as n
  from artworks
  where catalogue_number is null
)
update artworks a
set catalogue_number = o.n + coalesce((select max(catalogue_number) from artworks), 0)
from ordered o
where a.id = o.id;

create unique index if not exists artworks_catalogue_number_key on artworks (catalogue_number);

-- New pieces get the next number automatically if none is given.
create sequence if not exists artworks_catalogue_number_seq owned by artworks.catalogue_number;
select setval(
  'artworks_catalogue_number_seq',
  greatest((select coalesce(max(catalogue_number), 0) from artworks), 1),
  (select count(*) > 0 from artworks where catalogue_number is not null)
);
alter table artworks alter column catalogue_number set default nextval('artworks_catalogue_number_seq');

-- ============ INQUIRIES: type, subject, size, reference photos, replied ============
alter table inquiries add column if not exists inquiry_type text not null default 'question'; -- commission | listed_piece | question
alter table inquiries add column if not exists subject text;
alter table inquiries add column if not exists rough_size text;
alter table inquiries add column if not exists reference_paths text[] not null default '{}';
alter table inquiries add column if not exists replied_at timestamptz;

-- The artist can mark inquiries as replied from /admin.
drop policy if exists "Authenticated users update inquiries" on inquiries;
create policy "Authenticated users update inquiries"
  on inquiries for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============ STORAGE ============
-- Artwork photos (public bucket, created earlier in the dashboard): only the
-- logged-in artist may upload, replace or delete.
drop policy if exists "Authenticated users upload artwork images" on storage.objects;
create policy "Authenticated users upload artwork images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'artwork-images');
drop policy if exists "Authenticated users update artwork images" on storage.objects;
create policy "Authenticated users update artwork images"
  on storage.objects for update to authenticated
  using (bucket_id = 'artwork-images');
drop policy if exists "Authenticated users delete artwork images" on storage.objects;
create policy "Authenticated users delete artwork images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'artwork-images');

-- Visitors' commission reference photos: PRIVATE bucket. Only the server
-- (service role) writes here; only the logged-in artist can view.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inquiry-references', 'inquiry-references', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;
drop policy if exists "Authenticated users view inquiry references" on storage.objects;
create policy "Authenticated users view inquiry references"
  on storage.objects for select to authenticated
  using (bucket_id = 'inquiry-references');
