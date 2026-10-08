-- Sale prices: an optional "original price" shown crossed out next to the
-- real (charged) price, e.g. $300 -> $200, you save $100.
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
alter table artworks add column if not exists compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0);
alter table artwork_sizes add column if not exists compare_at_cents integer check (compare_at_cents is null or compare_at_cents >= 0);
