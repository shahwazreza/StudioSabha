// Site-wide banners the artist manages in /admin/announcement. All of them
// are stored as one JSON row ("announcement") in site_content, like the About
// content. (Browser-safe: the database read is in announcement-server.ts.)

export type AnnouncementStyle = "red" | "black" | "light";

export type Announcement = {
  id: string;
  enabled: boolean;
  message: string;
  link_label: string; // e.g. "Shop the sale"
  link_url: string; // e.g. "/shop?filter=sale" or "https://…"
  new_tab?: boolean; // open the button's link in a new tab (default: yes for other websites)
  starts_at: string | null; // ISO; empty = show now
  ends_at: string | null; // ISO; empty = until turned off
  countdown: boolean; // "Ends in 2d 14h" (needs ends_at)
  style: AnnouncementStyle;
  version: string; // changes on every save, so a closed banner reappears when it's edited
  created_at: string;
};

export function newAnnouncement(): Announcement {
  const now = new Date().toISOString();
  return {
    id: `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    enabled: true,
    message: "",
    link_label: "",
    link_url: "",
    starts_at: null,
    ends_at: null,
    countdown: false,
    style: "red",
    version: "",
    created_at: now,
  };
}

// Stored shape: { items: Announcement[] }. (Also accepts the earlier
// single-announcement shape, just in case.)
export function readAnnouncements(content: unknown): Announcement[] {
  const c = (content ?? {}) as { items?: Partial<Announcement>[]; message?: string };
  const raw = Array.isArray(c.items) ? c.items : c.message ? [c as Partial<Announcement>] : [];
  return raw.map((a, i) => ({
    ...newAnnouncement(),
    id: `legacy-${i}`,
    created_at: new Date(0).toISOString(),
    ...a,
  }));
}

export const isExternalLink = (url: string) => /^https?:\/\//i.test(url.trim());

// Other websites open in a new tab unless she says otherwise.
export const opensInNewTab = (a: Pick<Announcement, "link_url" | "new_tab">) =>
  a.new_tab ?? isExternalLink(a.link_url);

export type AnnouncementStatus = "off" | "scheduled" | "live" | "ended";

export function statusOf(a: Announcement, now = Date.now()): AnnouncementStatus {
  if (!a.enabled || !a.message.trim()) return "off";
  if (a.ends_at && new Date(a.ends_at).getTime() <= now) return "ended";
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return "scheduled";
  return "live";
}

export const isLive = (a: Announcement, now = Date.now()) => statusOf(a, now) === "live";

// Everything live right now, most recently started first (they take turns in the bar).
export function liveAnnouncements(items: Announcement[], now = Date.now()): Announcement[] {
  const startOf = (a: Announcement) => new Date(a.starts_at ?? a.created_at).getTime();
  return items.filter((a) => isLive(a, now)).sort((x, y) => startOf(y) - startOf(x));
}
