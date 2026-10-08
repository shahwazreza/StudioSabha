import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Artwork, ArtworkSize, newFirst, withSaleExpiry } from "@/lib/types";
import { isDemoMode, DEMO_ARTWORKS } from "@/lib/demo-data";

// Adds each piece's sizes (if any), in the order she set. Fetched separately
// so the site keeps working even if the sizes table isn't there yet.
export async function attachSizes(artworks: Artwork[]): Promise<Artwork[]> {
  if (isDemoMode || !artworks.length) return artworks;
  const { data, error } = await createClient()
    .from("artwork_sizes")
    .select("*")
    .in("artwork_id", artworks.map((a) => a.id))
    .order("sort_order", { ascending: true })
    .returns<ArtworkSize[]>();
  if (error) return artworks;
  const byArtwork = new Map<string, ArtworkSize[]>();
  for (const size of data ?? []) {
    byArtwork.set(size.artwork_id, [...(byArtwork.get(size.artwork_id) ?? []), size]);
  }
  return artworks.map((a) => ({ ...a, sizes: byArtwork.get(a.id) ?? [] }));
}

// Everything a shopper is allowed to see: NEW pieces first, then catalogue order.
export async function getStorefrontArtworks(): Promise<Artwork[]> {
  if (isDemoMode) return newFirst(DEMO_ARTWORKS);

  const supabase = createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*")
    .in("status", ["available", "sold_out", "inquire_only"])
    .order("catalogue_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Artwork[]>();
  return newFirst((await attachSizes(data ?? [])).map(withSaleExpiry));
}

// Not-for-sale pieces shown on the About page, in catalogue order.
export async function getPortfolio(): Promise<Artwork[]> {
  if (isDemoMode) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*")
    .eq("status", "portfolio")
    .order("catalogue_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Artwork[]>();
  return data ?? [];
}

export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  if (isDemoMode) return DEMO_ARTWORKS.find((a) => a.slug === slug) ?? null;

  const supabase = createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Artwork>();
  return data ? withSaleExpiry((await attachSizes([data]))[0]) : null;
}

// An old address (from before a rename) → the piece's current address.
export async function findRenamedSlug(oldSlug: string): Promise<string | null> {
  if (isDemoMode || !/^[a-z0-9-]+$/.test(oldSlug)) return null;
  const { data } = await createClient()
    .from("artworks")
    .select("slug")
    .contains("previous_slugs", [oldSlug])
    .limit(1)
    .maybeSingle();
  return data?.slug ?? null;
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
  if (isDemoMode) return DEMO_ARTWORKS.find((a) => a.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  const supabase = createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", id)
    .maybeSingle<Artwork>();
  return data;
}

// The pieces that follow this one in the catalogue (wrapping around),
// skipping anything already sold.
export function getRelated(all: Artwork[], current: Artwork, limit = 4) {
  const i = all.findIndex((a) => a.id === current.id);
  const rotated = [...all.slice(i + 1), ...all.slice(0, Math.max(i, 0))];
  return rotated.filter((a) => a.status !== "sold_out").slice(0, limit);
}

// Ranks pieces by units sold in paid orders, so the list keeps itself up to
// date with no admin work. Until there are enough sales, it's topped up in
// catalogue order — `hasSales` lets the page label it honestly.
export async function getBestSellers(
  storefront: Artwork[],
  limit = 3,
  exclude: string[] = []
): Promise<{ artworks: Artwork[]; hasSales: boolean }> {
  const unitsSold = new Map<string, number>();

  if (!isDemoMode) {
    // Order data isn't public, so this read uses the service client (server only).
    const { data } = await createServiceClient()
      .from("order_items")
      .select("artwork_id, quantity, orders!inner(status)")
      .in("orders.status", ["paid", "fulfilled"]);

    for (const row of data ?? []) {
      if (!row.artwork_id) continue;
      unitsSold.set(row.artwork_id, (unitsSold.get(row.artwork_id) ?? 0) + row.quantity);
    }
  }

  const candidates = storefront.filter((a) => !exclude.includes(a.id));
  const sold = candidates
    .filter((a) => unitsSold.has(a.id) && a.status !== "sold_out")
    .sort((a, b) => unitsSold.get(b.id)! - unitsSold.get(a.id)!);
  const rest = candidates.filter((a) => !unitsSold.has(a.id) && a.status !== "sold_out");

  return {
    artworks: [...sold, ...rest].slice(0, limit),
    hasSales: sold.length > 0,
  };
}
