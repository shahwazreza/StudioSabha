-- Web addresses follow the title: when a piece is renamed its address
-- (slug) changes, and the old one is kept here so old links redirect.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table artworks add column if not exists previous_slugs text[] not null default '{}';
create index if not exists artworks_previous_slugs_idx on artworks using gin (previous_slugs);
