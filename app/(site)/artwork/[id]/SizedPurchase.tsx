"use client";

import { useState } from "react";
import BuyButton from "./BuyButton";
import ViewOnWall from "@/components/ViewOnWall";
import { parseSize } from "@/lib/dimensions";
import { ArtworkSize, formatPrice, saleInfo } from "@/lib/types";
import PriceTag from "@/components/PriceTag";

// Stock: the chosen size's count sits under the dropdown, and the tag
// beside the price shows the total across all sizes.

// Buy area for a piece sold in several sizes: a size dropdown, the chosen
// size's stock, its price, and Buy now. Renders the desktop block and the phone's
// pinned buy bar, which share the same chosen size.
export default function SizedPurchase({
  artworkId,
  slug,
  title,
  sizes,
  tag,
  endsLabel,
}: {
  artworkId: string;
  slug: string;
  title: string;
  sizes: ArtworkSize[];
  tag: string;
  endsLabel?: string | null;
}) {
  const firstInStock = sizes.find((s) => s.quantity_available > 0);
  const [sizeId, setSizeId] = useState(firstInStock?.id ?? "");
  const size = sizes.find((s) => s.id === sizeId);
  const price = size ? formatPrice(size.price_cents) : "";
  const sale = size ? saleInfo(size.price_cents, size.compare_at_cents) : null;
  const totalLeft = sizes.reduce((sum, s) => sum + s.quantity_available, 0);

  return (
    <>
      <div className="field">
        <label htmlFor="size">Size</label>
        <select
          id="size"
          value={sizeId}
          onChange={(e) => setSizeId(e.target.value)}
          className="input text-[15px] font-semibold"
        >
          {sizes.map((s) => (
            <option key={s.id} value={s.id} disabled={s.quantity_available < 1}>
              {s.quantity_available < 1 ? `${s.label} — Sold out` : s.label}
            </option>
          ))}
        </select>
        {sale && (
          <p className="m-0 mt-1.5 text-sm font-semibold text-accent-700 md:hidden">
            On sale: was {sale.was}, you save {sale.save} ({sale.percent}%)
            {endsLabel ? `. ${endsLabel}.` : ""}
          </p>
        )}
        {size && (
          <p className={`m-0 mt-1.5 text-sm ${size.quantity_available === 1 ? "font-semibold text-accent-700" : "opacity-65"}`}>
            {size.quantity_available === 1 ? "Only 1 left" : `${size.quantity_available} left`} in this size
          </p>
        )}
      </div>

      <div className="hidden items-start justify-between gap-4 md:flex">
        <PriceTag
          price={price || "Sold out"}
          sale={sale}
          showSaving
          endsLabel={endsLabel}
          className="text-[44px] font-extrabold tracking-[-0.03em]"
          wasClassName="text-[28px]"
        />
        <span className="tag tag-outline mt-3">{totalLeft > 0 ? `${totalLeft} left in total` : tag}</span>
      </div>
      {size && <BuyButton artworkId={artworkId} sizeId={size.id} className="hidden md:block" />}
      {/* AR preview follows the chosen size. */}
      {size && parseSize(size.label) && <ViewOnWall slug={slug} title={title} sizeId={size.id} />}

      {/* Phones: pinned buy bar for the chosen size */}
      {size && (
        <div data-buy-bar
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[auto_1fr] items-center gap-4 border-t-2 border-rule bg-paper px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
          <PriceTag price={price} sale={sale} className="text-[28px] font-extrabold tracking-[-0.03em]" wasClassName="text-base" />
          <BuyButton artworkId={artworkId} sizeId={size.id} />
        </div>
      )}
    </>
  );
}
