-- Homepage slideshow. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Additive only; safe to run again.
--
-- Pieces with home_slide = true rotate in the slideshow at the top of the
-- homepage. The artist ticks "Show in homepage slideshow" in /admin.
alter table artworks add column if not exists home_slide boolean not null default false;
