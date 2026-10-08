import Link from "next/link";
import PortfolioGallery from "@/components/PortfolioGallery";
import { ArrowRight } from "@/components/icons";
import { Artwork } from "@/lib/types";

// The portfolio (not for sale) as a gallery wall. On the About page it shows
// everything; elsewhere a short preview links back to it.
export default function SelectedWork({
  pieces,
  preview = false,
}: {
  pieces: Artwork[];
  preview?: boolean;
}) {
  if (!pieces.length) return null;

  const items = pieces
    .filter((p) => p.image_urls[0])
    .map((p) => ({ id: p.id, src: p.image_urls[0], alt: p.title }));

  return (
    <section id="work" className="scroll-mt-4 border-t-2 border-rule px-5 py-8 md:px-10 md:py-14">
      <div className="mb-6 grid grid-cols-1 items-end gap-3 md:mb-8 md:grid-cols-[1fr_auto] md:gap-8">
        <div>
          <div className="kicker mb-2">Portfolio &middot; Not for sale</div>
          <h2 className="m-0 text-[32px] tracking-[-0.03em] md:text-5xl md:tracking-[-0.035em]">
            {preview ? "Her portrait work" : "Selected work"}
          </h2>
        </div>
        {preview ? (
          <Link href="/about#work" className="btn-ghost whitespace-nowrap">
            See the full portfolio <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <p className="m-0 max-w-[360px] text-sm opacity-75">
            Portraits and studies from over the years.{" "}
            <Link href="/commissions" className="font-semibold">
              Like this style? Commission a piece
            </Link>
            .
          </p>
        )}
      </div>
      <PortfolioGallery pieces={items} limit={preview ? 6 : undefined} />
    </section>
  );
}
