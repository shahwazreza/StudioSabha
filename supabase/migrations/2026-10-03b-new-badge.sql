-- "NEW" label. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Additive only; safe to run again.
--
-- A piece shows as NEW (and is listed first) for 60 days after marked_new_at.
-- The artist turns it on/off with "Show as NEW" in /admin.
alter table artworks add column if not exists marked_new_at timestamptz;

-- The two pieces added on 2026-10-03 start out as NEW.
update artworks
set marked_new_at = now()
where slug in ('the-eye-of-fear', 'red-waters') and marked_new_at is null;
