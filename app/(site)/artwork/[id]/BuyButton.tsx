"use client";

import { useState } from "react";
import { isDemoMode } from "@/lib/demo-data";
import { ArrowRight } from "@/components/icons";

// Only the artwork id is sent; the server looks up the real title and price.
export default function BuyButton({
  artworkId,
  sizeId,
  className = "",
}: {
  artworkId: string;
  sizeId?: string; // required by the server when the piece has sizes
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState(false);

  async function handleBuy() {
    if (isDemoMode) {
      setDemoMessage(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkId, sizeId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Checkout could not be started.");
      window.location.href = body.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong starting checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="btn btn-primary w-full py-[18px] text-[17px]"
      >
        {loading ? "Starting checkout…" : "Buy now"} <ArrowRight />
      </button>
      {error && <p className="mt-2 text-sm text-accent-700">{error}</p>}
      {demoMessage && (
        <p className="mt-2 text-sm opacity-65">
          This is a demo &mdash; once Square is connected, this button opens
          real checkout.
        </p>
      )}
    </div>
  );
}
