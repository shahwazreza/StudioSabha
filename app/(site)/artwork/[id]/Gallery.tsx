"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Close } from "@/components/icons";
import { isWallPhoto } from "@/lib/room-templates";

// Main view plus thumbnails. The painting is always shown whole at its true
// proportions (object-contain, never cropped or stretched); tapping it opens
// full screen. With several photos: ‹ › arrows beside the picture (desktop),
// swiping (phones), and ← → keys in full screen move between them.
export default function Gallery({ urls, title }: { urls: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  // Width / height of each photo, learned as they load. The viewing area takes
  // the shape of the TALLEST photo, so it never changes size when switching
  // photos (nothing on the page jumps); every photo fits whole inside it.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const known = urls.map((u) => ratios[u]).filter((r): r is number => Boolean(r));
  const ratio = known.length ? Math.min(...known) : 0.8;
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false); // a swipe shouldn't also count as a tap
  const many = urls.length > 1;
  const current = urls[active];
  const alt = isWallPhoto(current ?? "")
    ? `${title}, shown framed on a wall (for illustration)`
    : `${title}${many ? `, view ${active + 1}` : ""}`;

  const go = useCallback(
    (delta: number) => setActive((i) => (i + delta + urls.length) % urls.length),
    [urls.length]
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen, go]);

  if (!current) return <div className="aspect-[4/5] bg-surface" />;

  const swipeHandlers = many
    ? {
        onTouchStart: (e: React.TouchEvent) => {
          touchStartX.current = e.touches[0].clientX;
          swiped.current = false;
        },
        onTouchEnd: (e: React.TouchEvent) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) > 40) {
            swiped.current = true;
            go(dx < 0 ? 1 : -1);
          }
        },
      }
    : {};

  const arrow = (direction: -1 | 1, extra = "") => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        go(direction);
      }}
      aria-label={direction < 0 ? "Previous photo" : "Next photo"}
      className={`hidden h-11 w-11 shrink-0 items-center justify-center bg-paper text-ink shadow-sm hover:text-accent md:flex ${extra}`}
    >
      <ArrowRight className={`h-5 w-5 ${direction < 0 ? "rotate-180" : ""}`} />
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center justify-center" {...swipeHandlers}>
        {many && arrow(-1, "mr-3")}
        <button
          type="button"
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            setFullscreen(true);
          }}
          className="group relative block max-w-full cursor-zoom-in [--max-h:70vh] md:[--max-h:78vh]"
          style={{ aspectRatio: ratio, width: `min(100%, calc(var(--max-h) * ${ratio}))` }}
          aria-label={`View ${title} full screen`}
        >
          {/* All photos are stacked here and cross-fade, so the size is
              settled once and switching is smooth. */}
          {urls.map((url, i) => (
            <Image
              key={url}
              src={url}
              alt={i === active ? alt : ""}
              aria-hidden={i !== active}
              fill
              priority={i === 0}
              quality={90}
              className={`object-contain transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0"}`}
              sizes="(min-width: 768px) 760px, 100vw"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  const r = img.naturalWidth / img.naturalHeight;
                  setRatios((prev) => (prev[url] === r ? prev : { ...prev, [url]: r }));
                }
              }}
            />
          ))}
          <span className="absolute bottom-2 right-2 bg-paper/90 px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            View full screen
          </span>
        </button>
        {many && arrow(1, "ml-3")}
      </div>

      {urls.some(isWallPhoto) && (
        <p className={`m-0 text-center text-xs opacity-60 ${isWallPhoto(current) ? "" : "invisible"}`}>
          For illustration, not to scale.
        </p>
      )}

      {many && (
        <>
          {/* Thumbnails: centred, each at its picture's own shape, so the
              selection border hugs the picture rather than an empty square. */}
          <div className="hidden flex-wrap justify-center gap-4 md:flex">
            {urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show view ${i + 1}`}
                aria-pressed={i === active}
                className={`block outline-offset-2 transition-opacity ${
                  i === active ? "outline outline-2 outline-accent" : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={url} alt="" width={260} height={320} className="block h-32 w-auto" sizes="160px" />
              </button>
            ))}
          </div>
          {/* Phones: slim bars show which photo is showing (swipe or use the arrows). */}
          <div className="flex justify-center gap-1.5 px-5 md:hidden">
            {urls.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show view ${i + 1}`}
                aria-pressed={i === active}
                className="flex h-6 items-center"
              >
                <span className={`block h-[3px] w-6 ${i === active ? "bg-accent" : "bg-ink/30"}`} />
              </button>
            ))}
          </div>
        </>
      )}

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 bg-ink"
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            setFullscreen(false);
          }}
          {...swipeHandlers}
        >
          <Image src={current} alt={alt} fill quality={90} className="object-contain p-4 md:p-10" sizes="100vw" />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 bg-paper p-2 text-ink"
            aria-label="Close full screen"
          >
            <Close />
          </button>
          {many && (
            <>
              {arrow(-1, "absolute left-3 top-1/2 -translate-y-1/2")}
              {arrow(1, "absolute right-3 top-1/2 -translate-y-1/2")}
            </>
          )}
        </div>
      )}
    </div>
  );
}
