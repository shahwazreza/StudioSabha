"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Close } from "@/components/icons";

type Piece = { id: string; src: string; alt: string };

// A salon-style wall: paintings at their true proportions in staggered
// columns, no titles or prices. Clicking one opens a full-screen viewer with
// previous/next (arrow keys and Esc work too).
export default function PortfolioGallery({ pieces, limit }: { pieces: Piece[]; limit?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const shown = limit ? pieces.slice(0, limit) : pieces;

  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? i : (i + delta + pieces.length) % pieces.length)),
    [pieces.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, step]);

  const current = open === null ? null : pieces[open];

  return (
    <>
      <div className="columns-2 gap-3 md:columns-3 md:gap-5">
        {shown.map((piece, i) => (
          <button
            key={piece.id}
            type="button"
            onClick={() => setOpen(i)}
            className="mb-3 block w-full cursor-zoom-in break-inside-avoid transition-opacity hover:opacity-90 md:mb-5"
            aria-label={`View full screen: ${piece.alt}`}
          >
            <Image
              src={piece.src}
              alt={piece.alt}
              width={800}
              height={1000}
              className="h-auto w-full"
              sizes="(min-width: 768px) 400px, 50vw"
            />
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-50 bg-ink"
          onClick={() => setOpen(null)}
        >
          <Image src={current.src} alt={current.alt} fill quality={90} className="object-contain p-4 pb-20 md:p-12" sizes="100vw" />

          <button
            type="button"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 bg-paper p-2 text-ink"
            aria-label="Close"
          >
            <Close />
          </button>

          {pieces.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => step(-1)} className="bg-paper p-3 text-ink" aria-label="Previous">
                <ArrowRight className="h-5 w-5 rotate-180" />
              </button>
              <span className="min-w-[64px] text-center text-sm text-paper">
                {open! + 1} / {pieces.length}
              </span>
              <button type="button" onClick={() => step(1)} className="bg-paper p-3 text-ink" aria-label="Next">
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
