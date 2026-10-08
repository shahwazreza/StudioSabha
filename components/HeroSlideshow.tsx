"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export type Slide = {
  id: string;
  href: string;
  src: string;
  title: string;
  details: string;
  price: string;
  was?: string; // original price when on sale
};

const INTERVAL_MS = 5000;

// Homepage hero. One slide = a still picture; several = a cross-fading
// slideshow with dots. Auto-advances every 5s, pauses on hover/focus, can be
// swiped on phones, and never auto-plays for visitors who prefer reduced motion.
export default function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [index, count, paused, reducedMotion, go]);

  if (!count) return null;
  const current = slides[index];

  return (
    <div
      className="flex flex-col gap-3.5 p-5 md:p-10"
      aria-roledescription={count > 1 ? "carousel" : undefined}
      aria-label={count > 1 ? "Featured paintings" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative aspect-[4/5]"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchStartX.current = null;
        }}
      >
        {slides.map((slide, i) => (
          <Link
            key={slide.id}
            href={slide.href}
            tabIndex={i === index ? 0 : -1}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              priority={i === 0}
              quality={85}
              className="object-contain object-center"
              sizes="(min-width: 768px) 440px, 100vw"
            />
          </Link>
        ))}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2" role="tablist" aria-label="Choose a painting">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show ${slide.title}`}
              onClick={() => go(i)}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={`block h-2 w-2 rounded-full transition-colors ${
                  i === index ? "bg-accent" : "bg-ink/25 hover:bg-ink/50"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      <Link
        href={current.href}
        className="group grid grid-cols-[1fr_auto] items-baseline gap-4 border-t-2 border-rule pt-2.5 text-[13px] text-ink no-underline"
        aria-live={count > 1 ? "polite" : undefined}
      >
        <span>
          <b className="group-hover:text-accent">{current.title}</b>
          {current.details && (
            <>
              <br />
              {current.details}
            </>
          )}
        </span>
        <span className="text-right text-lg font-extrabold">
          {current.was && <s className="mr-2 text-sm font-normal opacity-50">{current.was}</s>}
          <span className={current.was ? "text-accent" : ""}>{current.price}</span>
        </span>
      </Link>
    </div>
  );
}
