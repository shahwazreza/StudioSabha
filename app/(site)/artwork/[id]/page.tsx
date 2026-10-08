import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Gallery from "./Gallery";
import BuyButton from "./BuyButton";
import SizedPurchase from "./SizedPurchase";
import WorkCard from "@/components/WorkCard";
import ViewOnWall from "@/components/ViewOnWall";
import { parseSize } from "@/lib/dimensions";
import { ArrowRight } from "@/components/icons";
import { findRenamedSlug, getArtworkBySlug, getRelated, getStorefrontArtworks } from "@/lib/artworks";
import { displayPrice, editionLabel, hasSizes, isNew, pieceSale, saleEndLabel } from "@/lib/types";
import PriceTag from "@/components/PriceTag";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const artwork = await getArtworkBySlug(params.id);
  return { title: artwork ? `${artwork.title} | StudioSabha` : "StudioSabha" };
}

export default async function ArtworkPage({ params }: { params: { id: string } }) {
  const artwork = await getArtworkBySlug(params.id);
  if (!artwork) {
    // Renamed piece: send old links to its new address.
    const current = await findRenamedSlug(params.id);
    if (current) permanentRedirect(`/artwork/${current}`);
    notFound();
  }
  if (artwork.status === "hidden" || artwork.status === "portfolio") notFound();

  const related = getRelated(await getStorefrontArtworks(), artwork);
  const isSold = artwork.status === "sold_out";
  const isInquireOnly = artwork.status === "inquire_only";
  const canBuy = artwork.status === "available";
  const askHref = `/contact?artwork=${artwork.id}`;
  const sizes = artwork.sizes ?? [];
  const sized = hasSizes(artwork);
  const sale = pieceSale(artwork);
  // "View on your wall" needs a real size. Pieces bought by size handle it in
  // SizedPurchase (it follows the dropdown); everything else uses its Size.
  const wallSizeLabel = sized ? sizes[0].label : artwork.dimensions;
  const showWallHere = !(canBuy && sized) && parseSize(wallSizeLabel) !== null;

  // Wall-label rows; anything she hasn't filled in is simply left out.
  const label = [
    ["Medium", artwork.medium],
    sized ? ["Sizes", sizes.map((s) => s.label).join(", ")] : ["Size", artwork.dimensions],
    ["Edition", editionLabel(artwork)],
    ["Signed", artwork.signed ? "By the artist" : null],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const kindTag = sized
    ? `${sizes.length} sizes`
    : artwork.is_print
      ? `Print · ${artwork.quantity_available} left`
      : "One of a kind";

  return (
    <div className="mx-auto max-w-page">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex flex-col gap-3 md:border-r-2 md:border-rule md:px-10 md:pb-10 md:pt-8">
          <div className="hidden text-[13px] opacity-65 md:block">
            <Link href="/shop" className="text-ink no-underline hover:text-accent">Shop</Link> / {artwork.title}
          </div>
          <Gallery urls={artwork.image_urls} title={artwork.title} />
        </div>

        <div className="flex flex-col gap-4 px-5 pt-2 md:gap-6 md:px-10 md:py-8">
          <div className="flex items-center gap-3 pt-4 md:pt-10">
            {isNew(artwork) && <span className="tag-new">New</span>}
            <span className="kicker">{artwork.is_print ? "Print" : "Original painting"}</span>
            {!isSold && <span className="tag tag-outline md:hidden">{kindTag}</span>}
          </div>
          <h1 className="m-0 text-[40px] leading-[0.95] tracking-[-0.04em] md:text-[64px]">{artwork.title}</h1>
          {sale && (
            <p className="m-0 text-sm font-semibold text-accent-700 md:hidden">
              On sale: was {sale.was}, you save {sale.save} ({sale.percent}%)
              {saleEndLabel(artwork) ? `. ${saleEndLabel(artwork)}.` : ""}
            </p>
          )}

          <div className="grid grid-cols-[90px_1fr] border-t-2 border-rule text-sm md:grid-cols-[120px_1fr]">
            {label.map(([key, value]) => (
              <div key={key} className="contents">
                <span className="border-b border-rule py-2.5 opacity-60">{key}</span>
                <span className="border-b border-rule py-2.5">{value}</span>
              </div>
            ))}
          </div>

          {artwork.description && (
            <p className="m-0 whitespace-pre-line text-base leading-normal md:text-[17px]">{artwork.description}</p>
          )}

          <div className="flex flex-col gap-2.5">
            {isSold ? (
              <p className="m-0 border-2 border-rule px-4 py-3 text-sm">
                This piece has sold.{" "}
                <Link href="/commissions" className="font-semibold">
                  Commission something similar
                </Link>
              </p>
            ) : (
              <>
                {canBuy && sized ? (
                  <SizedPurchase endsLabel={saleEndLabel(artwork)} artworkId={artwork.id} slug={artwork.slug} title={artwork.title} sizes={sizes} tag={kindTag} />
                ) : (
                  <>
                    <div className="hidden items-start justify-between gap-4 md:flex">
                      <PriceTag
                        price={displayPrice(artwork)}
                        sale={sale}
                        showSaving
                        endsLabel={saleEndLabel(artwork)}
                        className="text-[44px] font-extrabold tracking-[-0.03em]"
                        wasClassName="text-[28px]"
                      />
                      <span className="tag tag-outline mt-3">{kindTag}</span>
                    </div>
                    {canBuy && <BuyButton artworkId={artwork.id} className="hidden md:block" />}
                  </>
                )}
                <Link
                  href={askHref}
                  className={`btn ${isInquireOnly ? "btn-primary py-[18px] text-[17px]" : "btn-secondary py-3.5 text-[15px]"} hidden md:flex`}
                >
                  Ask about this piece <ArrowRight />
                </Link>
                {canBuy && (
                  <p className="m-0 hidden text-xs opacity-65 md:block">
                    {artwork.is_print || sized ? "" : "Once this piece sells, it's gone for good. "}
                    Secure checkout by Square.
                  </p>
                )}
                {canBuy && (
                  <Link href={askHref} className="btn-ghost self-start md:hidden">
                    Ask about this piece <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </>
            )}
            {showWallHere && (
              <ViewOnWall slug={artwork.slug} title={artwork.title} sizeId={sized ? sizes[0].id : undefined} />
            )}
          </div>

          <p className="m-0 border-t border-rule pt-3 text-xs opacity-60">
            &copy; Sabha Sumaiya. All rights reserved. This image may not be copied, printed, or
            reproduced without permission. Buying a piece doesn&rsquo;t transfer copyright.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-8 border-t-2 border-rule px-5 pb-10 pt-8 md:mt-0 md:px-10">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h3 className="m-0 text-2xl">More from the studio</h3>
            <Link href="/shop" className="btn-ghost whitespace-nowrap">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-4 md:gap-5">
            {related.map((w) => (
              <WorkCard key={w.id} artwork={w} compact sizes="(min-width: 768px) 300px, 50vw" />
            ))}
          </div>
        </section>
      )}

      {/* Phones: price and the main action stay pinned to the bottom. */}
      {(canBuy || isInquireOnly) && !(canBuy && sized) && (
        <div data-buy-bar
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[auto_1fr] items-center gap-4 border-t-2 border-rule bg-paper px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
          {isInquireOnly ? (
            <span className="text-[28px] font-extrabold tracking-[-0.03em]">On request</span>
          ) : (
            <PriceTag
              price={displayPrice(artwork)}
              sale={sale}
              className="text-[28px] font-extrabold tracking-[-0.03em]"
              wasClassName="text-base"
            />
          )}
          {canBuy ? (
            <BuyButton artworkId={artwork.id} />
          ) : (
            <Link href={askHref} className="btn btn-primary">
              Ask about it <ArrowRight />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
