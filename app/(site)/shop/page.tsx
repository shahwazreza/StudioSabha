import type { Metadata } from "next";
import Link from "next/link";
import ArtworkImage from "@/components/ArtworkImage";
import Reveal from "@/components/Reveal";
import WorkCard from "@/components/WorkCard";
import { ArrowRight } from "@/components/icons";
import { getStorefrontArtworks } from "@/lib/artworks";
import { Artwork, displayPrice, isNew, isOnSale, pieceSale, statusInfo } from "@/lib/types";
import PriceTag from "@/components/PriceTag";

export const revalidate = 60; // re-check for inventory changes every minute

export const metadata: Metadata = {
  title: "Shop | StudioSabha",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "originals", label: "Originals" },
  { key: "prints", label: "Prints" },
  { key: "sale", label: "On sale" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

function applyFilter(artworks: Artwork[], filter: FilterKey) {
  if (filter === "originals") return artworks.filter((a) => !a.is_print);
  if (filter === "prints") return artworks.filter((a) => a.is_print);
  if (filter === "sale") return artworks.filter(isOnSale);
  return artworks;
}

// Filter and view live in the URL, so they work without JavaScript and can be shared.
function hrefFor(filter: FilterKey, view: "index" | "grid") {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  if (view !== "grid") params.set("view", view);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

const INDEX_COLUMNS = "grid-cols-[120px_minmax(0,1fr)_180px_120px_130px_130px]";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { filter?: string; view?: string };
}) {
  const filter: FilterKey = FILTERS.some((f) => f.key === searchParams.filter)
    ? (searchParams.filter as FilterKey)
    : "all";
  // Grid is the default; the index (table) view is one click away on desktop.
  const view = searchParams.view === "index" ? "index" : "grid";

  const all = await getStorefrontArtworks();
  const artworks = applyFilter(all, filter);

  const filterLinks = (
    <div className="seg">
      {FILTERS.filter((f) => f.key !== "sale" || filter === "sale" || all.some(isOnSale)).map((f) => (
        <Link
          key={f.key}
          href={hrefFor(f.key, view)}
          aria-current={f.key === filter ? "true" : undefined}
          className="seg-opt text-ink"
          scroll={false}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );

  const grid = (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 md:gap-x-5 md:gap-y-8">
      {artworks.map((artwork, i) => (
        <Reveal key={artwork.id} delay={(i % 3) * 120}>
          <WorkCard artwork={artwork} sizes="(min-width: 768px) 400px, 50vw" />
        </Reveal>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-page">
      <div className="grid grid-cols-1 items-end gap-4 border-b-2 border-rule px-5 pb-4 pt-6 md:grid-cols-[1fr_auto] md:gap-6 md:px-10 md:pb-6 md:pt-12">
        <div>
          <div className="kicker mb-1.5 md:mb-2.5">
            {all.length} works
          </div>
          <h1 className="m-0 text-[56px] leading-[0.9] tracking-[-0.045em] md:text-[96px]">Shop</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {filterLinks}
          <div className="seg hidden md:inline-flex">
            <Link href={hrefFor(filter, "grid")} aria-current={view === "grid" ? "true" : undefined} className="seg-opt text-ink" scroll={false}>
              Grid
            </Link>
            <Link href={hrefFor(filter, "index")} aria-current={view === "index" ? "true" : undefined} className="seg-opt text-ink" scroll={false}>
              List
            </Link>
          </div>
        </div>
      </div>

      {artworks.length === 0 ? (
        <p className="px-5 py-10 opacity-65 md:px-10">
          {all.length === 0 ? "New work is on its way — check back soon." : "Nothing in this category right now."}
        </p>
      ) : (
        <>
          {/* Phones always get the grid; the index table needs a wide screen. */}
          <div className={`px-5 py-5 md:px-10 md:py-8 ${view === "index" ? "md:hidden" : ""}`}>{grid}</div>

          {view === "index" && (
            <div className="hidden md:block">
              <div className={`grid ${INDEX_COLUMNS} gap-x-5 border-b border-rule px-10 py-2.5 text-[11px] uppercase tracking-[0.08em] opacity-60`}>
                <span>Work</span>
                <span>Title</span>
                <span>Medium</span>
                <span>Size</span>
                <span>Price</span>
                <span>Status</span>
              </div>
              {artworks.map((a) => {
                const status = statusInfo(a);
                return (
                  <Link
                    key={a.id}
                    href={`/artwork/${a.slug}`}
                    className={`group grid ${INDEX_COLUMNS} items-center gap-x-5 border-b border-rule px-10 py-4 text-ink no-underline hover:bg-ink/[0.04] ${
                      a.status === "sold_out" ? "opacity-55" : ""
                    }`}
                  >
                    <ArtworkImage src={a.image_urls[0]} alt={a.title} sizes="120px" className="h-[150px] w-[120px]" />
                    <div>
                      {isNew(a) && <span className="tag-new mb-1.5 inline-block">New</span>}
                      <div className="text-2xl font-extrabold leading-[1.1] tracking-[-0.02em] group-hover:text-accent">
                        {a.title}
                      </div>
                      {a.description && (
                        <div className="mt-1.5 line-clamp-2 max-w-[380px] text-[13px] opacity-65">{a.description}</div>
                      )}
                    </div>
                    <span className="text-sm">{a.medium ?? "—"}</span>
                    <span className="text-sm">{a.dimensions ?? "—"}</span>
                    <span className="text-lg font-extrabold">{a.status === "sold_out" ? "—" : <PriceTag price={displayPrice(a)} sale={pieceSale(a)} wasClassName="text-sm" />}</span>
                    <span>
                      <span className={`tag ${status.tag}`}>{status.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="flex flex-col gap-3 border-t-2 border-rule px-5 py-6 md:flex-row md:items-center md:justify-between md:px-10 md:py-7">
        <span className="text-sm">Don&rsquo;t see it? Commissions are welcome.</span>
        <Link href="/commissions" className="btn btn-primary px-4 py-3 text-[15px]">
          Commission a piece <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
