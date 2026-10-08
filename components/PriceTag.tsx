import { Sale } from "@/lib/types";

// A price, or on sale: ~~$300~~ $200 (and "You save $100 (33%)" where there's room).
export default function PriceTag({
  price,
  sale,
  showSaving = false,
  endsLabel,
  className = "",
  wasClassName = "text-[0.7em]",
}: {
  price: string;
  sale?: Sale | null;
  showSaving?: boolean;
  endsLabel?: string | null; // e.g. "Sale ends Oct 12"
  className?: string;
  wasClassName?: string;
}) {
  if (!sale) return <span className={className}>{price}</span>;
  return (
    <span className="inline-flex flex-col">
      <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${className}`}>
        <s className={`font-normal opacity-50 ${wasClassName}`} aria-label={`Was ${sale.was}`}>
          {sale.was}
        </s>
        <span className="text-accent" aria-label={`Now ${price}`}>
          {price}
        </span>
      </span>
      {showSaving && (
        <span className="text-sm font-semibold text-accent-700">
          You save {sale.save} ({sale.percent}%){endsLabel ? ` \u00b7 ${endsLabel}` : ""}
        </span>
      )}
    </span>
  );
}
