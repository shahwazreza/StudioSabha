import { NextRequest, NextResponse } from "next/server";
import { createSquareCheckoutLink } from "@/lib/square";
import { createServiceClient } from "@/lib/supabase/server";
import { saleEnded } from "@/lib/types";

// Single-item "Buy now". The browser only says WHICH piece (and which size);
// title and price always come from the database, so a shopper can't change
// what they pay.
export async function POST(req: NextRequest) {
  const { artworkId, sizeId } = (await req.json().catch(() => ({}))) as {
    artworkId?: string;
    sizeId?: string;
  };

  if (!artworkId || typeof artworkId !== "string") {
    return NextResponse.json({ error: "No artwork selected." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: artwork } = await supabase
    .from("artworks")
    .select("id, title, price_cents, compare_at_cents, sale_ends_at, status, quantity_available")
    .eq("id", artworkId)
    .maybeSingle();

  // Re-check stock right before checkout so two shoppers can't both buy the
  // last copy of a one-of-a-kind original.
  if (!artwork || artwork.status !== "available" || artwork.quantity_available < 1) {
    return NextResponse.json({ error: "Sorry, this piece is no longer available." }, { status: 409 });
  }
  // Pieces offered in several sizes: the chosen size sets the price and stock.
  const { data: sizes } = await supabase
    .from("artwork_sizes")
    .select("id, label, price_cents, compare_at_cents, quantity_available")
    .eq("artwork_id", artwork.id);
  let size: { id: string; label: string; price_cents: number; compare_at_cents: number | null; quantity_available: number } | null = null;
  if (sizes?.length) {
    size = sizes.find((s) => s.id === sizeId) ?? null;
    if (!size) {
      return NextResponse.json({ error: "Please choose a size." }, { status: 400 });
    }
    if (size.quantity_available < 1) {
      return NextResponse.json({ error: `Sorry, ${size.label} is sold out.` }, { status: 409 });
    }
  }

  // After the piece's "End sale on" date, the original price applies again.
  const ended = saleEnded(artwork);
  const effective = (price: number, original: number | null) => (ended && original && original > price ? original : price);
  const priceCents = size
    ? effective(size.price_cents, size.compare_at_cents)
    : effective(artwork.price_cents, artwork.compare_at_cents);
  if (!Number.isInteger(priceCents) || priceCents < 100) {
    return NextResponse.json({ error: "This piece isn't priced yet. Please ask about it instead." }, { status: 409 });
  }

  const item = {
    artworkId: artwork.id,
    title: size ? `${artwork.title} (${size.label})` : artwork.title,
    priceCents,
    quantity: 1,
  };

  try {
    const { checkoutUrl, orderId } = await createSquareCheckoutLink(
      [item],
      `${process.env.NEXT_PUBLIC_SITE_URL}/`
    );

    // Record a pending order now; the Square webhook flips it to "paid"
    // and decrements inventory once payment actually completes.
    const { data: order } = await supabase
      .from("orders")
      .insert({
        square_order_id: orderId,
        total_cents: item.priceCents,
        status: "pending",
      })
      .select()
      .single();

    if (order) {
      await supabase.from("order_items").insert({
        order_id: order.id,
        artwork_id: item.artworkId,
        title_snapshot: item.title,
        price_cents_snapshot: item.priceCents,
        quantity: item.quantity,
        ...(size ? { size_id: size.id, size_label: size.label } : {}),
      });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }
}
