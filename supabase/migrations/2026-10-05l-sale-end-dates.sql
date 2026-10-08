-- "End sale on": optional date a piece's sale stops. After it, the original
-- price applies again (on the site and at checkout). Empty = sale has no end.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table artworks add column if not exists sale_ends_at timestamptz;
