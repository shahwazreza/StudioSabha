import { createClient } from "@/lib/supabase/server";
import { Artwork, Inquiry, newFirst, withSaleExpiry } from "@/lib/types";
import { attachSizes } from "@/lib/artworks";
import { isDemoMode, DEMO_ARTWORKS } from "@/lib/demo-data";

// Admin reads run as the logged-in artist, so database security rules apply.

export type OrderRow = {
  id: string;
  created_at: string;
  customer_email: string | null;
  total_cents: number;
  status: string;
  order_items: { title_snapshot: string }[];
};

export type InquiryWithPhotos = Inquiry & {
  photo_urls: string[];
  artwork: { title: string; catalogue_number: number | null; slug: string } | null;
};

export async function getAdminWorks(): Promise<Artwork[]> {
  if (isDemoMode) return newFirst(DEMO_ARTWORKS);
  const { data } = await createClient()
    .from("artworks")
    .select("*")
    .order("catalogue_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<Artwork[]>();
  return newFirst((await attachSizes(data ?? [])).map(withSaleExpiry));
}

export async function getAdminOrders(limit?: number): Promise<OrderRow[]> {
  if (isDemoMode) return [];
  let query = createClient()
    .from("orders")
    .select("id, created_at, customer_email, total_cents, status, order_items(title_snapshot)")
    .neq("status", "pending") // abandoned checkouts stay pending; they aren't sales
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query.returns<OrderRow[]>();
  return data ?? [];
}

export async function getAdminInquiries(limit?: number): Promise<InquiryWithPhotos[]> {
  if (isDemoMode) return [];
  const supabase = createClient();
  let query = supabase
    .from("inquiries")
    .select("*, artwork:artworks(title, catalogue_number, slug)")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data } = await query.returns<(Inquiry & { artwork: InquiryWithPhotos["artwork"] })[]>();
  const inquiries = data ?? [];

  // Reference photos live in a private bucket; hand out short-lived links.
  const paths = inquiries.flatMap((i) => i.reference_paths ?? []);
  const urlByPath = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from("inquiry-references")
      .createSignedUrls(paths, 60 * 60);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }

  return inquiries.map((i) => ({
    ...i,
    photo_urls: (i.reference_paths ?? []).map((p) => urlByPath.get(p)).filter((u): u is string => Boolean(u)),
  }));
}

export function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
