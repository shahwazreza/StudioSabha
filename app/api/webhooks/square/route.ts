import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

// Configure this URL in Square Developer Dashboard > Webhooks, subscribed to
// the "payment.updated" event. Docs:
// https://developer.squareup.com/docs/webhooks/overview
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.type === "payment.updated") {
    const payment = event.data.object.payment;
    if (payment.status === "COMPLETED") {
      const supabase = createServiceClient();

      // Only a still-pending order is marked paid. Square can send the same
      // event more than once; this makes sure stock is only taken off once.
      const { data: order } = await supabase
        .from("orders")
        .update({ status: "paid", square_payment_id: payment.id })
        .eq("square_order_id", payment.order_id)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      if (order) {
        const { data: items } = await supabase
          .from("order_items")
          .select("artwork_id, size_id, quantity")
          .eq("order_id", order.id);

        for (const item of items ?? []) {
          if (!item.artwork_id) continue;

          let remaining: number;
          if (item.size_id) {
            // Take stock off the size that was bought; the piece's total is
            // the sum of its sizes.
            const { data: size } = await supabase
              .from("artwork_sizes")
              .select("quantity_available")
              .eq("id", item.size_id)
              .maybeSingle();
            if (size) {
              await supabase
                .from("artwork_sizes")
                .update({ quantity_available: Math.max(0, size.quantity_available - item.quantity) })
                .eq("id", item.size_id);
            }
            const { data: sizes } = await supabase
              .from("artwork_sizes")
              .select("quantity_available")
              .eq("artwork_id", item.artwork_id);
            remaining = (sizes ?? []).reduce((sum, s) => sum + s.quantity_available, 0);
          } else {
            const { data: artwork } = await supabase
              .from("artworks")
              .select("quantity_available")
              .eq("id", item.artwork_id)
              .single();
            remaining = Math.max(0, (artwork?.quantity_available ?? 0) - item.quantity);
          }

          await supabase
            .from("artworks")
            .update({
              quantity_available: remaining,
              status: remaining === 0 ? "sold_out" : "available",
            })
            .eq("id", item.artwork_id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

function verifySignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) return false;
  const hmac = crypto.createHmac("sha256", process.env.SQUARE_WEBHOOK_SIGNATURE_KEY);
  hmac.update(process.env.NEXT_PUBLIC_SITE_URL + "/api/webhooks/square" + rawBody);
  const expected = Buffer.from(hmac.digest("base64"));
  const given = Buffer.from(signature);
  // timingSafeEqual throws on different lengths, so check that first.
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
