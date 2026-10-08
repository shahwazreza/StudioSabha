-- Run this in Supabase: Dashboard > SQL Editor > New query > paste > Run

-- ============ ARTWORKS ============
create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  medium text,               -- e.g. "Oil on canvas", "Giclee print"
  dimensions text,           -- e.g. "24 x 36 in"
  price_cents integer not null,
  is_print boolean not null default false,  -- true = print/reproducible, false = one-of-a-kind original
  quantity_available integer not null default 1,
  image_urls text[] not null default '{}',
  status text not null default 'available', -- available | sold_out | hidden | inquire_only | portfolio (see migrations)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists artworks_status_idx on artworks (status);

-- ============ ORDERS ============
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  square_order_id text,
  square_payment_id text,
  customer_email text,
  customer_name text,
  shipping_address jsonb,
  total_cents integer not null,
  status text not null default 'pending', -- pending | paid | fulfilled | cancelled
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  artwork_id uuid references artworks(id),
  title_snapshot text not null,   -- artwork title at time of purchase
  price_cents_snapshot integer not null,
  quantity integer not null default 1
);

-- ============ COMMISSION / CONTACT REQUESTS ============
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  artwork_id uuid references artworks(id), -- null if general inquiry
  created_at timestamptz not null default now()
);

-- ============ ROW LEVEL SECURITY ============
alter table artworks enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table inquiries enable row level security;

-- Public can read available artworks (storefront)
create policy "Public can view available artworks"
  on artworks for select
  using (status in ('available', 'sold_out', 'inquire_only'));

-- Only authenticated (logged-in artist) can insert/update/delete artworks
create policy "Authenticated users manage artworks"
  on artworks for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Orders/order_items/inquiries: no public read access.
-- Server routes use the service_role key (bypasses RLS) to write these.
create policy "Authenticated users view orders"
  on orders for select using (auth.role() = 'authenticated');
create policy "Authenticated users view order items"
  on order_items for select using (auth.role() = 'authenticated');
create policy "Authenticated users view inquiries"
  on inquiries for select using (auth.role() = 'authenticated');

-- ============ STORAGE ============
-- After running this file, also go to Storage in the Supabase dashboard and
-- create a public bucket named "artwork-images" for photo uploads.

-- ============ LATER CHANGES ============
-- After this file (and creating the bucket above), run every file in
-- supabase/migrations/ in date order. They add the catalogue numbers,
-- richer inquiries, reference-photo storage and the storage permissions.
