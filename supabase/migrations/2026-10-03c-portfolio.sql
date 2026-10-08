-- Portfolio pieces (shown on the About page, not for sale).
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.
--
-- Uses a new artwork status, 'portfolio'. The public may now read those rows
-- too; the shop and buy pages still only show for-sale statuses.
drop policy if exists "Public can view available artworks" on artworks;
create policy "Public can view available artworks"
  on artworks for select
  using (status in ('available', 'sold_out', 'inquire_only', 'portfolio'));
