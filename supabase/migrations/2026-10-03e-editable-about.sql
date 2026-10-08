-- Editable About section. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Additive only; safe to run again.
--
-- One row per editable block (for now just 'about'), holding JSON content.
-- Until the artist saves from /admin/about, the site shows its built-in text.
create table if not exists site_content (
  id text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "Public can read site content" on site_content;
create policy "Public can read site content"
  on site_content for select
  using (true);

drop policy if exists "Authenticated users edit site content" on site_content;
create policy "Authenticated users edit site content"
  on site_content for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
