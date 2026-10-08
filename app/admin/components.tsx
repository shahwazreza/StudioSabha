import Link from "next/link";
import Image from "next/image";
import { Artwork, INQUIRY_TYPE_LABELS, displayPrice, formatCat, formatPrice, isNew, isOnSale, statusInfo } from "@/lib/types";
import { InquiryWithPhotos, OrderRow } from "@/lib/admin-data";
import InquiryActions from "./InquiryActions";
import DeleteArtworkButton from "@/components/DeleteArtworkButton";

export function SectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h3 className="m-0 text-xl md:text-2xl">{title}</h3>
      {href && (
        <Link href={href} className="btn-ghost whitespace-nowrap text-sm">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

export function WorksTable({ works }: { works: Artwork[] }) {
  if (!works.length) return <p className="py-4 opacity-65">No pieces added yet.</p>;

  return (
    <>
      {/* Desktop: table */}
      <table className="table hidden md:table">
        <thead>
          <tr>
            <th>Cat.</th>
            <th></th>
            <th>Title</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {works.map((w) => {
            const status = statusInfo(w);
            return (
              <tr key={w.id}>
                <td className="font-extrabold text-accent">{formatCat(w.catalogue_number)}</td>
                <td className="w-[52px]">
                  <div className="relative h-[50px] w-10 bg-neutral-300">
                    {w.image_urls[0] && <Image src={w.image_urls[0]} alt="" fill className="object-cover" sizes="40px" />}
                  </div>
                </td>
                <td className="font-semibold">
                  {w.title}
                  {isNew(w) && <span className="tag-new ml-2 align-middle">New</span>}
                  {w.home_slide && <span className="tag tag-outline ml-2 align-middle">Homepage</span>}
                  {isOnSale(w) && <span className="tag-new ml-2 bg-ink align-middle">Sale</span>}
                </td>
                <td>{displayPrice(w)}</td>
                <td>{w.quantity_available}</td>
                <td>
                  <span className={`tag ${status.tag}`}>{status.label}</span>
                </td>
                <td className="whitespace-nowrap">
                  <Link href={`/admin/${w.id}/edit`} className="font-semibold">
                    Edit
                  </Link>
                  <DeleteArtworkButton
                    key={w.id}
                    id={w.id}
                    title={w.title}
                    imageUrls={w.image_urls}
                    className="ml-4 text-sm font-semibold text-ink/60 hover:text-accent"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Phones: compact rows, the whole row opens the editor */}
      <div className="md:hidden">
        {works.map((w) => {
          const status = statusInfo(w);
          return (
            <Link
              key={w.id}
              href={`/admin/${w.id}/edit`}
              className="grid min-h-14 grid-cols-[36px_1fr_auto] items-center gap-3 border-t border-rule py-3 text-ink no-underline"
            >
              <b className="text-accent">{formatCat(w.catalogue_number)}</b>
              <div>
                <div className="text-sm font-semibold leading-tight">
                  {w.title}
                  {isNew(w) && <span className="tag-new ml-1.5 align-middle text-[10px]">New</span>}
                </div>
                <div className="text-xs opacity-65">
                  {displayPrice(w)} · {w.quantity_available} in stock
                </div>
              </div>
              <span className={`tag ${status.tag}`}>{status.short}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  if (!orders.length) return <p className="py-4 opacity-65">No orders yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="table min-w-[560px]">
        <thead>
          <tr>
            <th>Date</th>
            <th>Work</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="whitespace-nowrap">
                {new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
              <td className="font-semibold">{o.order_items.map((i) => i.title_snapshot).join(", ") || "—"}</td>
              <td>{o.customer_email ?? "—"}</td>
              <td className="font-extrabold">{formatPrice(o.total_cents)}</td>
              <td>
                <span className="tag tag-neutral capitalize">{o.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function InquiryCard({ inquiry, full = false }: { inquiry: InquiryWithPhotos; full?: boolean }) {
  const details = [
    inquiry.artwork ? `Cat. ${formatCat(inquiry.artwork.catalogue_number)} · ${inquiry.artwork.title}` : null,
    inquiry.subject ? `Subject: ${inquiry.subject}` : null,
    inquiry.rough_size ? `Size: ${inquiry.rough_size}` : null,
  ].filter(Boolean);

  return (
    <div className={`flex flex-col gap-1.5 border-t-2 border-rule pb-[18px] pt-3.5 ${inquiry.replied_at ? "opacity-60" : ""}`}>
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-semibold uppercase tracking-[0.06em] text-accent-700">
          {INQUIRY_TYPE_LABELS[inquiry.inquiry_type] ?? "Message"}
          {inquiry.replied_at && <span className="ml-2 font-normal normal-case tracking-normal text-ink/60">· Replied</span>}
        </span>
        <span className="opacity-60">{timeAgo(inquiry.created_at)}</span>
      </div>
      <div className="text-base font-extrabold">{inquiry.name}</div>
      {details.length > 0 && <div className="text-[13px] opacity-75">{details.join(" · ")}</div>}
      <div className={`whitespace-pre-line text-sm leading-[1.45] opacity-80 ${full ? "" : "line-clamp-4"}`}>{inquiry.message}</div>
      {inquiry.photo_urls.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {inquiry.photo_urls.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Reference photo ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 object-cover" />
            </a>
          ))}
        </div>
      )}
      {/* Keyed by id so button state (e.g. "Deleting…") stays with this
          inquiry when the list refreshes, instead of moving to the next one. */}
      <InquiryActions
        key={inquiry.id}
        inquiry={{
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          subject: inquiry.subject,
          type: inquiry.inquiry_type,
          replied: Boolean(inquiry.replied_at),
          referencePaths: inquiry.reference_paths ?? [],
        }}
      />
    </div>
  );
}
