"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Announcement, AnnouncementStatus, newAnnouncement, statusOf } from "@/lib/announcement";
import { SHOP_TIME_ZONE } from "@/lib/shop-time";
import { Plus } from "@/components/icons";
import AnnouncementForm from "./AnnouncementForm";
import { refreshSite } from "../actions";

const STATUS: Record<AnnouncementStatus, { label: string; className: string }> = {
  live: { label: "Live now", className: "tag-new" },
  scheduled: { label: "Scheduled", className: "tag tag-outline" },
  ended: { label: "Ended", className: "tag tag-neutral" },
  off: { label: "Off", className: "tag tag-neutral" },
};

const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: SHOP_TIME_ZONE,
        timeZoneName: "short",
      })
    : null;

// All announcements: see them, add, edit, turn on/off, delete. Everything is
// saved together as one list.
export default function AnnouncementsManager({ initial }: { initial: Announcement[] }) {
  const [items, setItems] = useState<Announcement[]>(initial);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  async function persist(next: Announcement[]): Promise<string | null> {
    const { error } = await createClient()
      .from("site_content")
      .upsert({ id: "announcement", content: { items: next }, updated_at: new Date().toISOString() });
    if (error) return error.message;
    await refreshSite();
    setItems(next);
    return null;
  }

  async function save(a: Announcement) {
    const exists = items.some((x) => x.id === a.id);
    const error = await persist(exists ? items.map((x) => (x.id === a.id ? a : x)) : [a, ...items]);
    if (!error) {
      setEditing(null);
      const s = statusOf(a);
      setNotice({
        ok: true,
        text:
          s === "live"
            ? "Saved. It's live on the website now."
            : s === "scheduled"
              ? "Saved. It will appear at its start time."
              : s === "ended"
                ? "Saved, but its end time has passed, so it isn't showing."
                : "Saved. It's turned off.",
      });
    }
    return error;
  }

  async function remove(a: Announcement) {
    if (!window.confirm(`Delete this announcement?\n\n“${a.message}”\n\nThis can’t be undone.`)) return;
    const error = await persist(items.filter((x) => x.id !== a.id));
    setNotice(error ? { ok: false, text: error } : { ok: true, text: "Announcement deleted." });
  }

  async function toggle(a: Announcement) {
    const error = await persist(items.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled, version: String(Date.now()) } : x)));
    if (error) setNotice({ ok: false, text: error });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="m-0 text-2xl">{items.some((x) => x.id === editing.id) ? "Edit announcement" : "New announcement"}</h2>
        <AnnouncementForm key={editing.id} initial={editing} onSave={save} onCancel={() => setEditing(null)} />
      </div>
    );
  }

  const order: AnnouncementStatus[] = ["live", "scheduled", "off", "ended"];
  const sorted = [...items].sort((x, y) => order.indexOf(statusOf(x, now)) - order.indexOf(statusOf(y, now)));

  return (
    <div className="flex max-w-3xl flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => setEditing(newAnnouncement())} className="btn btn-primary px-4 py-3 text-[15px]">
          New announcement <Plus className="h-4 w-4" />
        </button>
        {notice && <span className={`text-sm ${notice.ok ? "" : "text-accent-700"}`}>{notice.text}</span>}
      </div>

      {items.length === 0 ? (
        <p className="m-0 border-t-2 border-rule py-6 opacity-65">No announcements yet.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {sorted.map((a) => {
            const s = statusOf(a, now);
            return (
              <li key={a.id} className="flex flex-col gap-2 border-t-2 border-rule py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={STATUS[s].className}>{STATUS[s].label}</span>
                </div>
                <p className="m-0 text-base font-extrabold">{a.message}</p>
                <p className="m-0 text-xs opacity-65">
                  {a.starts_at ? `Starts ${when(a.starts_at)}` : "Starts when turned on"}
                  {" · "}
                  {a.ends_at ? `Ends ${when(a.ends_at)}` : "No end date"}
                  {a.countdown ? " · Countdown" : ""}
                  {a.link_url ? ` · Button: ${a.link_label || "Learn more"} → ${a.link_url}` : ""}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold">
                  <button type="button" onClick={() => setEditing(a)} className="text-ink hover:text-accent">
                    Edit
                  </button>
                  <button type="button" onClick={() => toggle(a)} className="text-ink/70 hover:text-ink">
                    {a.enabled ? "Turn off" : "Turn on"}
                  </button>
                  <button type="button" onClick={() => remove(a)} className="text-accent hover:text-accent-700">
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
