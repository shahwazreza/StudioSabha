// Thin wrapper around Square's Checkout API using plain fetch, so we don't
// need the full Square SDK. Docs: https://developer.squareup.com/docs/checkout-api/overview

const SQUARE_BASE_URL =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

type CheckoutItem = {
  artworkId: string;
  title: string;
  priceCents: number;
  quantity: number;
};

// Creates a hosted Square Checkout page and returns its URL.
// The shopper is redirected there to enter payment details; Square handles
// PCI compliance, so no card data ever touches our server.
export async function createSquareCheckoutLink(
  items: CheckoutItem[],
  redirectUrl: string
) {
  const res = await fetch(`${SQUARE_BASE_URL}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": "2024-08-21",
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: process.env.SQUARE_LOCATION_ID,
        line_items: items.map((item) => ({
          name: item.title,
          quantity: String(item.quantity),
          base_price_money: {
            amount: item.priceCents,
            currency: "USD",
          },
          metadata: { artwork_id: item.artworkId },
        })),
      },
      checkout_options: {
        redirect_url: redirectUrl,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Square checkout link failed: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  return {
    checkoutUrl: data.payment_link.url as string,
    orderId: data.payment_link.order_id as string,
  };
}
