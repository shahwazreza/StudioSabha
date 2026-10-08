import Link from "next/link";
import ArtworkImage from "@/components/ArtworkImage";
import { Artwork, displayPrice, isNew, isOnSale, pieceSale } from "@/lib/types";
import PriceTag from "@/components/PriceTag";

// Gallery card: the painting, then title and price like a wall label.
// (Catalogue numbers are internal; they only show in /admin.)
export default function WorkCard({
  artwork,
  sizes = "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw",
  compact = false,
}: {
  artwork: Artwork;
  sizes?: string;
  compact?: boolean;
}) {
  const sold = artwork.status === "sold_out";
  const details = [artwork.medium, artwork.dimensions].filter(Boolean).join(", ");

  return (
    <Link
      href={`/artwork/${artwork.slug}`}
      className={`group relative flex flex-col gap-2.5 text-ink no-underline ${sold ? "opacity-55" : ""}`}
    >
      {(isNew(artwork) || isOnSale(artwork)) && (
        <span className="absolute left-0 top-0 z-10 flex gap-1">
          {isNew(artwork) && <span className="tag-new">New</span>}
          {isOnSale(artwork) && <span className="tag-new bg-ink">Sale</span>}
        </span>
      )}
      <div className="transition-opacity group-hover:opacity-90">
        <ArtworkImage src={artwork.image_urls[0]} alt={artwork.title} sizes={sizes} />
      </div>
      <div>
        {/* Phones: price on its own line under the title (two narrow columns
            can't fit both side by side). Wider screens: side by side. */}
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <span className={`min-w-0 break-words font-extrabold leading-tight group-hover:text-accent ${compact ? "text-sm" : "text-[15px] sm:text-[17px]"}`}>
            {artwork.title}
          </span>
          <span className={`shrink-0 ${compact ? "text-[13px]" : "text-sm sm:text-[17px] sm:font-extrabold"}`}>
            {sold ? "Sold" : <PriceTag price={displayPrice(artwork)} sale={pieceSale(artwork)} wasClassName="text-[0.85em]" />}
          </span>
        </div>
        {!compact && details && <div className="mt-0.5 text-[13px] opacity-65">{details}</div>}
      </div>
    </Link>
  );
}
