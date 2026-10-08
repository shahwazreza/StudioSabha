import Link from "next/link";
import ArtistAbout from "@/components/ArtistAbout";
import CommissionPoster from "@/components/CommissionPoster";
import HeroSlideshow, { Slide } from "@/components/HeroSlideshow";
import Reveal from "@/components/Reveal";
import WorkCard from "@/components/WorkCard";
import { ArrowRight } from "@/components/icons";
import { getBestSellers, getPortfolio, getStorefrontArtworks } from "@/lib/artworks";
import { getAbout } from "@/lib/about";
import { Artwork, displayPrice, pieceSale } from "@/lib/types";

export const revalidate = 60; // re-check for inventory changes every minute

export default async function HomePage() {
  const [storefront, portfolio, about] = await Promise.all([getStorefrontArtworks(), getPortfolio(), getAbout()]);

  // Hero slideshow: the pieces she ticked "Show in homepage slideshow" for
  // (still for sale, with a photo). If none are ticked, fall back to the first
  // piece that's for sale.
  const showable = (a: Artwork) => a.status !== "sold_out" && Boolean(a.image_urls[0]);
  const chosen = storefront.filter((a) => a.home_slide && showable(a));
  const fallback =
    storefront.find((a) => a.status === "available" && showable(a)) ?? storefront.find(showable);
  const heroPieces = chosen.length ? chosen : fallback ? [fallback] : [];
  const slides: Slide[] = heroPieces.map((a) => ({
    id: a.id,
    href: `/artwork/${a.slug}`,
    src: a.image_urls[0],
    title: a.title,
    details: [a.medium, a.dimensions].filter(Boolean).join(", "),
    price: displayPrice(a),
    was: pieceSale(a)?.was,
  }));
  const featured = await getBestSellers(storefront, 3, heroPieces.map((a) => a.id));

  return (
    <div className="mx-auto max-w-page">
      {/* Hero */}
      <section className="grid grid-cols-1 border-b-2 border-rule md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col justify-between gap-5 border-b-2 border-rule px-5 pb-6 pt-7 md:gap-12 md:border-b-0 md:border-r-2 md:px-10 md:pb-10 md:pt-14">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] uppercase tracking-kicker md:text-xs">
            <span className="text-accent">Original paintings</span>
            <span>Sabha Sumaiya</span>

          </div>
          <h1 className="m-0 text-balance text-[54px] leading-[0.9] tracking-[-0.045em] md:text-[80px] xl:text-[112px]">
            Ordinary days, painted until they&rsquo;re real.
          </h1>
          <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-2 md:gap-8">
            <p className="m-0 max-w-[360px] text-[15px] leading-[1.45] md:text-[17px]">
              Hyper-realistic paintings of everyday scenes by Sabha Sumaiya,
              working primarily in acrylics.
            </p>
            <div className="flex flex-col gap-2">
              <Link href="/shop" className="btn btn-primary">
                Shop available works <ArrowRight />
              </Link>
              <Link href="/commissions" className="btn btn-secondary">
                Commission a piece <ArrowRight />
              </Link>
            </div>
          </div>
        </div>

        <HeroSlideshow slides={slides} />
      </section>


      {/* Available now / best sellers */}
      {featured.artworks.length > 0 && (
        <section className="px-5 pb-10 pt-7 md:px-10 md:pb-16 md:pt-14">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 md:mb-6">
            <h2 className="m-0 text-[32px] tracking-[-0.03em] md:text-5xl md:tracking-[-0.035em]">
              {featured.hasSales ? "Best sellers" : "Available now"}
            </h2>
            <Link href="/shop" className="btn-ghost whitespace-nowrap">
              See all {storefront.length} works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
            {featured.artworks.map((artwork, i) => (
              <Reveal key={artwork.id} delay={i * 120}>
                <WorkCard artwork={artwork} sizes="(min-width: 768px) 400px, 100vw" />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <ArtistAbout about={about} showWorkLink={portfolio.length > 0} />
      {/* Highlights strip (edited in /admin/about), right under her bio */}
      <section className="grid auto-rows-fr grid-cols-2 border-t border-rule md:grid-cols-4">
        {about.highlights.map((c, i, all) => (
          // Lines only BETWEEN boxes: no outer left/right edge. Phones show a
          // 2 x 2 grid (right column has no right line); wider screens show
          // one row (only the last box has no right line).
          <div
            key={i}
            className={`border-b border-rule px-5 py-3.5 md:border-b-0 md:py-[22px] md:pl-6 md:pr-10 ${
              i % 2 === 0 ? "border-r" : "md:border-r"
            } ${i === all.length - 1 ? "md:border-r-0" : ""}`}
          >
            <div className="label-muted mb-1.5 text-[10px] md:text-[11px]">{c.kicker}</div>
            <div className="text-sm font-extrabold leading-tight md:text-base">{c.title}</div>
            <div className="mt-1 hidden text-xs opacity-65 md:block">{c.detail}</div>
          </div>
        ))}
      </section>
      <CommissionPoster />
    </div>
  );
}
