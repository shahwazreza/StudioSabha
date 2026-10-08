"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Announcement, AnnouncementStyle, liveAnnouncements, opensInNewTab } from "@/lib/announcement";
import { ArrowRight, Close } from "@/components/icons";

const STYLES: Record<AnnouncementStyle, string> = {
  red: "bg-accent text-paper",
  black: "bg-ink text-paper",
  light: "bg-surface text-ink",
};

function countdown(msLeft: number) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

// Banners above the header, on the homepage (Index) only. Every live
// announcement gets its own row, stacked (most recently started on top), and
// each appears/disappears right on time by the visitor's clock. Each row's ×
// hides it until the page is refreshed or they come back.
export default function AnnouncementBar({ announcements }: { announcements: Announcement[] }) {
  const onHome = usePathname() === "/";
  const [now, setNow] = useState<number | null>(null);
  const [closed, setClosed] = useState<string[]>([]);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Render nothing until mounted: avoids a flash, and the time check needs the visitor's clock.
  if (!onHome || now === null) return null;
  const live = liveAnnouncements(announcements, now).filter((a) => !closed.includes(a.id));
  if (!live.length) return null;

  return (
    <div role="region" aria-label="Announcements" className="divide-y divide-ink/15">
      {live.map((a) => {
        const showCountdown = a.countdown && a.ends_at;
        const left = showCountdown ? new Date(a.ends_at!).getTime() - now : 0;
        return (
          <div key={a.id} className={`relative ${STYLES[a.style] ?? STYLES.red}`}>
            <div className="mx-auto flex max-w-page flex-wrap items-center justify-center gap-x-5 gap-y-1 px-12 py-3.5 text-center text-[15px] md:px-14 md:py-4 md:text-base">
              <span className="font-semibold">{a.message}</span>
              {showCountdown && (
                <span className="font-extrabold tabular-nums" aria-live="off">
                  Ends in {countdown(left)}
                </span>
              )}
              {a.link_url && (
                <Link
                  href={a.link_url.trim()}
                  {...(opensInNewTab(a) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-1 font-extrabold text-current underline underline-offset-4 hover:no-underline"
                >
                  {a.link_label || "Learn more"} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => setClosed((c) => [...c, a.id])}
              aria-label={`Close announcement: ${a.message}`}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-80 hover:opacity-100 md:right-4"
            >
              <Close className="h-5 w-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
