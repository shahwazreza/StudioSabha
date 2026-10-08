-- Sizes: a piece can be offered in several sizes, each with its own price and
-- stock; buyers choose one from a dropdown. Run once in Supabase:
-- SQL Editor > New query > paste > Run. Additive only; safe to run again.

create table if not exists artwork_sizes (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks(id) on delete cascade,
  label text not null,                                   -- e.g. "8 × 10 in"
  price_cents integer not null check (price_cents >= 0),
  quantity_available integer not null default 1 check (quantity_available >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists artwork_sizes_artwork_idx on artwork_sizes (artwork_id);

alter table artwork_sizes enable row level security;

-- Shoppers can see the sizes of pieces that are on the site.
drop policy if exists "Public can view sizes of visible artworks" on artwork_sizes;
create policy "Public can view sizes of visible artworks"
  on artwork_sizes for select
  using (exists (
    select 1 from artworks a
    where a.id = artwork_id and a.status in ('available', 'sold_out', 'inquire_only')
  ));

drop policy if exists "Authenticated users manage sizes" on artwork_sizes;
create policy "Authenticated users manage sizes"
  on artwork_sizes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Orders remember which size was bought (the label is kept even if the size
-- is later removed).
alter table order_items add column if not exists size_id uuid references artwork_sizes(id) on delete set null;
alter table order_items add column if not exists size_label text;
