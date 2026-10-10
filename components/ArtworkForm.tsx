"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createWallPhoto, prepareDisplayCopy } from "@/lib/prepare-image";
import { WALL_PHOTO_MARKER, isWallPhoto } from "@/lib/room-templates";
import { artworkImagePath } from "@/lib/storage-paths";
import { Artwork, NEW_DAYS, isNew, saleEnded } from "@/lib/types";

import { isoToShopInput, shopInputToISO } from "@/lib/shop-time";

// A size row as edited in the form (numbers kept as text while typing).
type SizeRow = { id?: string; label: string; price: string; compareAt: string; quantity: string };
import { ArrowRight } from "@/components/icons";
import { refreshSite } from "@/app/admin/actions";
import { useAdminPaths } from "@/app/admin/AdminPathProvider";

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Turns database errors into something the artist can act on.
function friendlyError(err: { message?: string; code?: string }) {
  const msg = err.message ?? "";
  if (err.code === "23505" && msg.includes("catalogue")) return "That catalogue number is already used by another piece.";
  if (err.code === "23505" && msg.includes("slug")) return "There's already a piece with this title. Please use a different title.";
  return msg || "Something went wrong saving this piece.";
}

export default function ArtworkForm({ artwork }: { artwork?: Artwork }) {
  const router = useRouter();
  const admin = useAdminPaths();
  const supabase = createClient();
  const isEditing = Boolean(artwork);

  const [catalogueNumber, setCatalogueNumber] = useState(artwork?.catalogue_number?.toString() ?? "");
  const [title, setTitle] = useState(artwork?.title ?? "");
  const [description, setDescription] = useState(artwork?.description ?? "");
  const [medium, setMedium] = useState(artwork?.medium ?? "");
  const [dimensions, setDimensions] = useState(artwork?.dimensions ?? "");
  const [price, setPrice] = useState(artwork && artwork.price_cents > 0 ? (artwork.price_cents / 100).toString() : "");
  // Optional "original price", shown crossed out when it's higher than the price.
  const [compareAt, setCompareAt] = useState(artwork?.compare_at_cents ? (artwork.compare_at_cents / 100).toString() : "");
  // "End sale on": the sale stops at this date and time (Eastern). Empty = no end.
  const [saleEndDate, setSaleEndDate] = useState(isoToShopInput(artwork?.sale_ends_at));
  const [isPrint, setIsPrint] = useState(artwork?.is_print ?? false);
  const [edition, setEdition] = useState(artwork?.edition ?? "");
  const [signed, setSigned] = useState(artwork?.signed ?? false);
  const [showAsNew, setShowAsNew] = useState(artwork ? isNew(artwork) : true);
  const [homeSlide, setHomeSlide] = useState(artwork?.home_slide ?? false);
  const [quantity, setQuantity] = useState(artwork?.quantity_available?.toString() ?? "1");
  const [status, setStatus] = useState(artwork?.status ?? "available");
  const [sizes, setSizes] = useState<SizeRow[]>(
    (artwork?.sizes ?? []).map((s) => ({
      id: s.id,
      label: s.label,
      price: (s.price_cents / 100).toString(),
      compareAt: s.compare_at_cents ? (s.compare_at_cents / 100).toString() : "",
      quantity: s.quantity_available.toString(),
    }))
  );
  const [existingImages, setExistingImages] = useState<string[]>(artwork?.image_urls ?? []);
  // A freshly made "painting on a wall" photo, uploaded only when she saves.
  const [pendingWall, setPendingWall] = useState<{ blob: Blob; preview: string } | null>(null);
  const [makingWall, setMakingWall] = useState(false);
  const wallSource = existingImages.find((url) => !isWallPhoto(url));

  async function makeWallPhoto() {
    if (!wallSource) return;
    setMakingWall(true);
    setError(null);
    try {
      const blob = await createWallPhoto(wallSource);
      if (pendingWall) URL.revokeObjectURL(pendingWall.preview);
      setPendingWall({ blob, preview: URL.createObjectURL(blob) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the wall photo.");
    } finally {
      setMakingWall(false);
    }
  }
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New pieces get the next catalogue number; she can change it.
  useEffect(() => {
    if (isEditing) return;
    supabase
      .from("artworks")
      .select("catalogue_number")
      .not("catalogue_number", "is", null)
      .order("catalogue_number", { ascending: false })
      .limit(1)
      .then(({ data }) => setCatalogueNumber(String((data?.[0]?.catalogue_number ?? 0) + 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Only a smaller, watermarked copy with copyright info is stored (the site
  // shows it). Full-size originals stay with the artist, not in Supabase.
  // A web address made from the title that no other piece uses (now or as an
  // old address); adds -2, -3… if needed.
  async function uniqueSlug(base: string): Promise<string> {
    const root = base || "untitled";
    for (let n = 1; n < 50; n++) {
      const candidate = n === 1 ? root : `${root}-${n}`;
      let query = supabase
        .from("artworks")
        .select("id", { count: "exact", head: true })
        .or(`slug.eq.${candidate},previous_slugs.cs.{${candidate}}`);
      if (artwork) query = query.neq("id", artwork.id);
      const { count } = await query;
      if (!count) return candidate;
    }
    return `${root}-${Date.now()}`;
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of newFiles) {
      const display = await prepareDisplayCopy(file);
      const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "photo";
      const path = `${Date.now()}-${baseName}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("artwork-images")
        .upload(path, display, { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("artwork-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const toCents = (v: string) => Math.round(parseFloat(v || "0") * 100);
    const sizeRows = sizes.filter((s) => s.label.trim() || s.price.trim());
    if (sizeRows.some((s) => !s.label.trim())) {
      setError("Every size needs a name, e.g. “8 × 10 in”.");
      return;
    }
    if (status === "available" && sizeRows.some((s) => toCents(s.price) < 100)) {
      setError("Every size needs a price before this piece can be Available.");
      return;
    }

    // With sizes, the piece's own price/stock are worked out from them
    // (lowest price, total stock) so cards, sorting and stats stay right.
    const priceCents = sizeRows.length ? Math.min(...sizeRows.map((s) => toCents(s.price))) : toCents(price);
    const totalQuantity = sizeRows.length
      ? sizeRows.reduce((sum, s) => sum + (parseInt(s.quantity || "0", 10) || 0), 0)
      : parseInt(quantity || "0", 10);
    if (status === "available" && priceCents < 100) {
      setError("Add a price before marking this piece Available (or choose “Inquire only”).");
      return;
    }

    setSaving(true);
    try {
      const uploadedUrls = await uploadImages();
      let imageUrls = [...existingImages, ...uploadedUrls];

      // New wall photo: upload it and put it second (after the main photo),
      // replacing any previous wall photo (which is then deleted below).
      if (pendingWall) {
        const path = `${Date.now()}-${slugify(title) || "photo"}${WALL_PHOTO_MARKER}.jpg`;
        const { error: wallError } = await supabase.storage
          .from("artwork-images")
          .upload(path, pendingWall.blob, { contentType: "image/jpeg" });
        if (wallError) throw wallError;
        const wallUrl = supabase.storage.from("artwork-images").getPublicUrl(path).data.publicUrl;
        const rest = imageUrls.filter((url) => !isWallPhoto(url));
        imageUrls = [...rest.slice(0, 1), wallUrl, ...rest.slice(1)];
      }

      // The address follows the title. On a rename, the old address is kept
      // so existing links redirect. (Portfolio pieces have no page; their
      // address never changes.)
      let slug = artwork?.slug ?? (await uniqueSlug(slugify(title)));
      let previousSlugs = artwork?.previous_slugs ?? [];
      if (artwork && status !== "portfolio" && slugify(title) !== artwork.slug.replace(/-\d+$/, "")) {
        slug = await uniqueSlug(slugify(title));
        if (slug !== artwork.slug) previousSlugs = [...previousSlugs, artwork.slug];
      }
      previousSlugs = Array.from(new Set(previousSlugs)).filter((s) => s !== slug);

      const payload = {
        catalogue_number: catalogueNumber ? parseInt(catalogueNumber, 10) : null,
        title,
        slug,
        previous_slugs: previousSlugs,
        description: description || null,
        medium: medium || null,
        dimensions: dimensions || null,
        price_cents: priceCents,
        // Only for pieces without sizes (sizes carry their own); ignored unless higher than the price.
        compare_at_cents: !sizeRows.length && toCents(compareAt) > priceCents ? toCents(compareAt) : null,
        sale_ends_at: shopInputToISO(saleEndDate),
        is_print: isPrint,
        edition: edition || null,
        signed,
        // Keep the original date while it stays NEW, so the 60 days don't restart on every edit.
        marked_new_at: showAsNew
          ? artwork && isNew(artwork) ? artwork.marked_new_at : new Date().toISOString()
          : null,
        home_slide: homeSlide,
        quantity_available: totalQuantity,
        status,
        image_urls: imageUrls,
        updated_at: new Date().toISOString(),
      };

      let artworkId = artwork?.id;
      if (isEditing && artwork) {
        const { error: saveError } = await supabase.from("artworks").update(payload).eq("id", artwork.id);
        if (saveError) throw saveError;
      } else {
        const { data: created, error: saveError } = await supabase.from("artworks").insert(payload).select("id").single();
        if (saveError) throw saveError;
        artworkId = created.id;
      }

      // Sync sizes: update kept rows, add new ones, delete removed ones.
      const originalIds = (artwork?.sizes ?? []).map((s) => s.id);
      if (artworkId && (sizeRows.length || originalIds.length)) {
        const keptIds = sizeRows.map((s) => s.id).filter(Boolean);
        const removed = originalIds.filter((id) => !keptIds.includes(id));
        if (removed.length) {
          const { error: delError } = await supabase.from("artwork_sizes").delete().in("id", removed);
          if (delError) throw delError;
        }
        for (const [i, row] of sizeRows.entries()) {
          const values = {
            artwork_id: artworkId,
            label: row.label.trim(),
            price_cents: toCents(row.price),
            compare_at_cents: toCents(row.compareAt) > toCents(row.price) ? toCents(row.compareAt) : null,
            quantity_available: parseInt(row.quantity || "0", 10) || 0,
            sort_order: i,
          };
          const { error: sizeError } = row.id
            ? await supabase.from("artwork_sizes").update(values).eq("id", row.id)
            : await supabase.from("artwork_sizes").insert(values);
          if (sizeError) throw sizeError;
        }
      }
      // Photos she removed with "Remove" are deleted from storage once the
      // save has gone through (best effort; the piece is already updated).
      const removedPaths = (artwork?.image_urls ?? [])
        .filter((url) => !imageUrls.includes(url))
        .map(artworkImagePath)
        .filter((p): p is string => Boolean(p));
      if (removedPaths.length) {
        const { data: removed } = await supabase.storage.from("artwork-images").remove(removedPaths);
        if ((removed?.length ?? 0) < removedPaths.length) {
          console.warn("Some removed photos couldn't be deleted from storage:", removedPaths);
        }
      }

      await refreshSite();

      router.push(admin.href("/works"));
      router.refresh();
    } catch (err) {
      setError(friendlyError(err as { message?: string; code?: string }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <div className="field">
          <label htmlFor="cat">Catalogue no.</label>
          <input id="cat" type="number" min="1" value={catalogueNumber} onChange={(e) => setCatalogueNumber(e.target.value)} className="input text-lg font-extrabold text-accent" />
        </div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="input" />
          {status === "portfolio" && (
            <p className="mt-1 text-xs opacity-65">
              Portfolio titles aren&rsquo;t shown on the site; describe the picture here (used for screen readers).
            </p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[110px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="medium">Medium</label>
          <input id="medium" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="Acrylic on canvas" className="input" />
        </div>
        <div className="field">
          <label htmlFor="dimensions">Size</label>
          <input id="dimensions" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="18 × 24 in" className="input" />
        </div>
      </div>

      {sizes.length === 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="field">
            <label htmlFor="price">Price (USD)</label>
            <input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Leave blank for inquire only" className="input" />
          </div>
          <div className="field">
            <label htmlFor="compareAt">Original price (for a sale)</label>
            <input id="compareAt" type="number" min="0" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} placeholder="Optional" className="input" />
            <p className="mt-1 text-xs opacity-65">
              Shown crossed out if higher than the price, e.g. <s>$300</s> $200. Clear it to end the sale.
            </p>
          </div>
          <div className="field">
            <label htmlFor="quantity">Quantity available</label>
            <input id="quantity" required type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t-2 border-rule pt-4">
        <div>
          <span className="text-sm font-extrabold">Sizes &amp; prices</span>
          <p className="m-0 mt-0.5 text-xs opacity-65">
            Optional. Add sizes if buyers can choose between them (each with its own price and stock); they&rsquo;ll pick
            from a dropdown. With no sizes, the single price and quantity above are used.
          </p>
        </div>
        {sizes.map((row, i) => (
          <div key={row.id ?? `new-${i}`} className="grid grid-cols-[1fr_90px_90px_70px] items-end gap-2 sm:grid-cols-[1fr_110px_110px_90px_auto]">
            <div className="field">
              <label>Size</label>
              <input
                value={row.label}
                onChange={(e) => setSizes((all) => all.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)))}
                placeholder="8 × 10 in"
                className="input"
              />
            </div>
            <div className="field">
              <label>Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.price}
                onChange={(e) => setSizes((all) => all.map((s, j) => (j === i ? { ...s, price: e.target.value } : s)))}
                className="input"
              />
            </div>
            <div className="field">
              <label title="Original price, shown crossed out for a sale">Was (optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.compareAt}
                onChange={(e) => setSizes((all) => all.map((s, j) => (j === i ? { ...s, compareAt: e.target.value } : s)))}
                className="input"
              />
            </div>
            <div className="field">
              <label>In stock</label>
              <input
                type="number"
                min="0"
                value={row.quantity}
                onChange={(e) => setSizes((all) => all.map((s, j) => (j === i ? { ...s, quantity: e.target.value } : s)))}
                className="input"
              />
            </div>
            <div className="col-span-4 flex gap-1 text-sm sm:col-span-1 sm:pb-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => setSizes((all) => { const l = [...all]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; return l; })}
                className="px-2 py-2 disabled:opacity-30"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === sizes.length - 1}
                onClick={() => setSizes((all) => { const l = [...all]; [l[i], l[i + 1]] = [l[i + 1], l[i]]; return l; })}
                className="px-2 py-2 disabled:opacity-30"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setSizes((all) => all.filter((_, j) => j !== i))}
                className="px-2 py-2 font-semibold text-accent"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setSizes((all) => [...all, { label: "", price: price || "", compareAt: "", quantity: "1" }])}
          className="btn btn-secondary self-start px-4 py-2.5 text-sm"
        >
          + Add a size
        </button>
      </div>

      {(compareAt.trim() || sizes.some((s) => s.compareAt.trim())) && (
        <div className="field border-l-2 border-accent pl-3">
          <label htmlFor="saleEnd">End sale on: date and time, Eastern time (optional)</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="saleEnd"
              type="datetime-local"
              value={saleEndDate}
              onChange={(e) => setSaleEndDate(e.target.value)}
              className="input max-w-[260px]"
            />
            {saleEndDate && (
              <button type="button" onClick={() => setSaleEndDate("")} className="text-xs font-semibold text-accent">
                Clear date
              </button>
            )}
          </div>
          <p className="mt-1 text-xs opacity-65">
            At this date and time (US Eastern) the original price comes back automatically. Leave empty to keep the
            sale running until you remove it.
          </p>
          {artwork && saleEnded(artwork) && (
            <p className="mt-1 text-xs font-semibold text-accent-700">
              This sale has ended. Shoppers now see and pay the original price. Pick a new date to restart it, or clear the
              original price.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 border-y-2 border-rule py-4">
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={isPrint} onChange={(e) => setIsPrint(e.target.checked)} className="h-4 w-4 accent-accent" />
          This is a print (not the one-of-a-kind original)
        </label>
        <div className="field">
          <label htmlFor="edition">Edition</label>
          <input
            id="edition"
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            placeholder={isPrint ? "e.g. Edition of 50" : "Leave blank to show “Original, 1 of 1”"}
            className="input"
          />
        </div>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" checked={signed} onChange={(e) => setSigned(e.target.checked)} className="h-4 w-4 accent-accent" />
          Signed by the artist
        </label>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={showAsNew} onChange={(e) => setShowAsNew(e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          Show as <span className="tag-new">New</span>
          <span className="mt-0.5 block text-xs opacity-65">
            Listed first in the shop with a NEW label. Turns off by itself after {NEW_DAYS} days.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={homeSlide} onChange={(e) => setHomeSlide(e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          Show in homepage slideshow
          <span className="mt-0.5 block text-xs opacity-65">
            The big picture at the top of the homepage. Tick several pieces and they rotate as a slideshow.
            (Not used for sold, hidden or portfolio pieces.)
          </span>
        </span>
      </label>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value as Artwork["status"])} className="input">
          <option value="available">Available (Buy now button)</option>
          <option value="inquire_only">Inquire only (no price shown)</option>
          <option value="sold_out">Sold</option>
          <option value="portfolio">Portfolio (About page, not for sale)</option>
          <option value="hidden">Hidden (not shown on site)</option>
        </select>
      </div>

      <div className="field">
        <span className="field-label">Photos (the first one is the main image)</span>
        {existingImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {existingImages.map((url, i) => (
              <div key={url} className="flex w-20 flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className={`h-24 w-20 object-cover ${i === 0 ? "outline outline-2 -outline-offset-2 outline-accent" : ""}`} />
                <button
                  type="button"
                  onClick={() => setExistingImages((imgs) => imgs.filter((u) => u !== url))}
                  className="text-left text-xs font-semibold text-accent"
                >
                  Remove
                </button>
              </div>
            ))}
            {pendingWall && (
              <div className="flex w-20 flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingWall.preview} alt="New wall photo" className="h-24 w-20 object-cover outline outline-2 -outline-offset-2 outline-ink/40" />
                <span className="text-[11px] leading-tight opacity-65">New wall photo, added when you save</span>
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(pendingWall.preview);
                    setPendingWall(null);
                  }}
                  className="text-left text-xs font-semibold text-accent"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        )}

        {/* "Painting on a wall" photo from the main photo and a room template. */}
        <div className="mb-4 flex flex-wrap items-center gap-3 border border-rule p-3">
          {wallSource ? (
            <>
              <button
                type="button"
                onClick={makeWallPhoto}
                disabled={makingWall}
                className="btn btn-secondary px-3 py-2 text-sm"
              >
                {makingWall ? "Creating\u2026" : existingImages.some(isWallPhoto) || pendingWall ? "Recreate wall photo" : "Create wall photo"}
              </button>
              <span className="text-xs opacity-65">
                Shows this painting framed on a wall, using its main photo. Works best when the main photo shows only the
                artwork (no table or background).
              </span>
            </>
          ) : (
            <span className="text-xs opacity-65">Save the piece with a photo first, then you can create a wall photo.</span>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
          className="block text-sm"
        />
        {existingImages.length > 0 && (
          <p className="mt-1.5 text-xs opacity-65">Removed photos disappear from the site when you save.</p>
        )}
      </div>

      {error && <p className="m-0 text-sm text-accent-700">{error}</p>}

      <button type="submit" disabled={saving} className="btn btn-primary self-start">
        {saving ? "Saving…" : isEditing ? "Save changes" : "Add piece"} <ArrowRight />
      </button>
    </form>
  );
}
