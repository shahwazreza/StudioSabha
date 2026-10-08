import { SHOP_TIME_ZONE } from "@/lib/shop-time";

export type Artwork = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  medium: string | null;
  dimensions: string | null;
  price_cents: number;
  compare_at_cents?: number | null; // "original price" shown crossed out when higher than price_cents
  sale_ends_at?: string | null; // after this, the original price applies again (null = no end)
  is_print: boolean;
  quantity_available: number;
  image_urls: string[];
  // portfolio = shown on the About page only, never for sale
  status: "available" | "sold_out" | "hidden" | "inquire_only" | "portfolio";
  catalogue_number: number | null;
  edition: string | null; // e.g. "Edition of 50"; originals fall back to "Original, 1 of 1"
  signed: boolean;
  marked_new_at: string | null; // shows as NEW (and is listed first) for NEW_DAYS after this
  home_slide: boolean; // shown in the homepage slideshow
  previous_slugs?: string[]; // old web addresses (before renames); they redirect here
  sizes?: ArtworkSize[]; // optional; when present the buyer picks one
  created_at: string;
  updated_at: string;
};

// One purchasable size of a piece, with its own price and stock.
export type ArtworkSize = {
  id: string;
  artwork_id: string;
  label: string;
  price_cents: number;
  compare_at_cents?: number | null;
  quantity_available: number;
  sort_order: number;
};

export type InquiryType = "commission" | "listed_piece" | "question";

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  message: string;
  artwork_id: string | null;
  inquiry_type: InquiryType;
  subject: string | null;
  rough_size: string | null;
  reference_paths: string[];
  replied_at: string | null;
  created_at: string;
};

export const INQUIRY_TYPE_LABELS: Record<InquiryType, string> = {
  commission: "Commission",
  listed_piece: "Listed piece",
  question: "Question",
};

export const NEW_DAYS = 60;

export function isNew(a: Pick<Artwork, "marked_new_at">) {
  if (!a.marked_new_at) return false;
  return Date.now() - new Date(a.marked_new_at).getTime() < NEW_DAYS * 24 * 60 * 60 * 1000;
}

// NEW pieces first (most recently marked first), then catalogue order.
export function newFirst<T extends Pick<Artwork, "marked_new_at">>(artworks: T[]): T[] {
  const newOnes = artworks
    .filter(isNew)
    .sort((a, b) => new Date(b.marked_new_at!).getTime() - new Date(a.marked_new_at!).getTime());
  return [...newOnes, ...artworks.filter((a) => !isNew(a))];
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

// "7" -> "07": catalogue numbers always show at least two digits.
export function formatCat(n: number | null | undefined) {
  return n == null ? "—" : String(n).padStart(2, "0");
}

export function displayPrice(a: Artwork) {
  if (a.status === "inquire_only") return "On request";
  const prices = (a.sizes ?? []).map((s) => s.price_cents);
  if (prices.length) {
    const min = Math.min(...prices);
    return prices.some((p) => p !== min) ? `From ${formatPrice(min)}` : formatPrice(min);
  }
  return formatPrice(a.price_cents);
}

// A real discount: original price above the charged price.
export type Sale = { was: string; save: string; percent: number };
export function saleInfo(priceCents: number, compareAtCents?: number | null): Sale | null {
  if (!compareAtCents || compareAtCents <= priceCents || priceCents <= 0) return null;
  const saved = compareAtCents - priceCents;
  return { was: formatPrice(compareAtCents), save: formatPrice(saved), percent: Math.round((saved / compareAtCents) * 100) };
}

// "Sale ends Oct 12, 6:00 PM EDT" for a piece with an end date (shown under
// the sale price). Shown in the artist's time zone so every visitor sees the
// same moment, with the zone named.
export function saleEndLabel(a: Pick<Artwork, "sale_ends_at">) {
  if (!a.sale_ends_at || saleEnded(a)) return null;
  const when = new Date(a.sale_ends_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: SHOP_TIME_ZONE,
    timeZoneName: "short",
  });
  return `Sale ends ${when}`;
}

// Past its "End sale on" date? Then the original prices apply again.
export function saleEnded(a: Pick<Artwork, "sale_ends_at">, now = Date.now()) {
  return Boolean(a.sale_ends_at && new Date(a.sale_ends_at).getTime() <= now);
}

// The prices shoppers actually see and pay: once a sale has ended, each
// discounted price goes back to its original price.
export function withSaleExpiry<T extends Artwork>(a: T): T {
  if (!saleEnded(a)) return a;
  const restore = (price: number, original?: number | null) => (original && original > price ? original : price);
  return {
    ...a,
    price_cents: restore(a.price_cents, a.compare_at_cents),
    compare_at_cents: null,
    sizes: a.sizes?.map((s) => ({ ...s, price_cents: restore(s.price_cents, s.compare_at_cents), compare_at_cents: null })),
  };
}

// Is any part of this piece (its own price or any size) on sale?
export function isOnSale(a: Artwork) {
  if (a.status !== "available" || saleEnded(a)) return false;
  if (a.sizes?.length) return a.sizes.some((s) => saleInfo(s.price_cents, s.compare_at_cents));
  return saleInfo(a.price_cents, a.compare_at_cents) !== null;
}

// The single sale to show for a piece without sizes (null otherwise).
export function pieceSale(a: Artwork) {
  if (a.status !== "available" || a.sizes?.length || saleEnded(a)) return null;
  return saleInfo(a.price_cents, a.compare_at_cents);
}

export function hasSizes(a: Artwork) {
  return (a.sizes?.length ?? 0) > 0;
}

export function editionLabel(a: Artwork) {
  if (a.edition) return a.edition;
  return a.is_print ? "Print" : "Original, 1 of 1";
}

// Short status used in the shop index and admin tables.
export function statusInfo(a: Artwork): { label: string; short: string; tag: string } {
  if (a.status === "sold_out") return { label: "Sold", short: "Sold", tag: "tag-neutral" };
  if (a.status === "inquire_only") return { label: "On request", short: "Inquire", tag: "tag-neutral" };
  if (a.status === "hidden") return { label: "Hidden", short: "Hidden", tag: "tag-neutral" };
  if (a.status === "portfolio") return { label: "Portfolio", short: "Portfolio", tag: "tag-neutral" };
  if (a.is_print) {
    const left = `${a.quantity_available} left`;
    return { label: `Print · ${left}`, short: left, tag: "tag-accent" };
  }
  return { label: "Original", short: "Original", tag: "tag-outline" };
}
