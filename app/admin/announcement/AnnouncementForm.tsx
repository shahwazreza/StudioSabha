"use client";

import { useState } from "react";
import { Announcement, AnnouncementStyle, isExternalLink, opensInNewTab } from "@/lib/announcement";
import { ArrowRight } from "@/components/icons";

import { isoToShopInput as toLocalInput, shopInputToISO as fromLocalInput } from "@/lib/shop-time";

const LINK_PRESETS = [
  { label: "No button", url: "" },
  { label: "Shop: items on sale", url: "/shop?filter=sale" },
  { label: "Shop: everything", url: "/shop" },
  { label: "Commissions", url: "/commissions" },
  { label: "About", url: "/about" },
  { label: "Contact", url: "/contact" },
];

const STYLE_OPTIONS: { value: AnnouncementStyle; label: string; preview: string }[] = [
  { value: "red", label: "Red", preview: "bg-accent text-paper" },
  { value: "black", label: "Black", preview: "bg-ink text-paper" },
  { value: "light", label: "Light", preview: "bg-surface text-ink border border-rule" },
];

// Editor for ONE announcement; the list page saves it.
export default function AnnouncementForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Announcement;
  onSave: (a: Announcement) => Promise<string | null>; // returns an error message, or null
  onCancel: () => void;
}) {
  const [a, setA] = useState<Announcement>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const preset = LINK_PRESETS.some((p) => p.url === a.link_url) ? a.link_url : "custom";

  function set<K extends keyof Announcement>(key: K, value: Announcement[K]) {
    setA((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (a.countdown && !a.ends_at) {
      setMessage({ ok: false, text: "Set an end date and time to show a countdown." });
      return;
    }
    if (a.starts_at && a.ends_at && new Date(a.ends_at) <= new Date(a.starts_at)) {
      setMessage({ ok: false, text: "The end must be after the start." });
      return;
    }
    if (!a.message.trim()) {
      setMessage({ ok: false, text: "Write a message first." });
      return;
    }
    setSaving(true);
    const error = await onSave({ ...a, message: a.message.trim(), version: String(Date.now()) });
    setSaving(false);
    if (error) setMessage({ ok: false, text: error });
  }

  const styleClass = STYLE_OPTIONS.find((s) => s.value === a.style)?.preview ?? STYLE_OPTIONS[0].preview;

  return (
    <form onSubmit={save} className="flex max-w-2xl flex-col gap-6">
      <label className="flex items-center gap-3 text-base font-semibold">
        <input type="checkbox" checked={a.enabled} onChange={(e) => set("enabled", e.target.checked)} className="h-5 w-5 accent-accent" />
        Turned on (shows during its dates)
      </label>

      <div className="field">
        <label htmlFor="msg">Message</label>
        <input
          id="msg"
          value={a.message}
          maxLength={140}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Autumn Sale: 20% off all originals"
          className="input"
        />
        <p className="mt-1 text-xs opacity-65">Keep it short so it fits on one line on phones. {a.message.length}/140</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="linkTo">Button goes to</label>
          <select
            id="linkTo"
            value={preset}
            onChange={(e) => set("link_url", e.target.value === "custom" ? "/" : e.target.value)}
            className="input"
          >
            {LINK_PRESETS.map((p) => (
              <option key={p.url} value={p.url}>
                {p.label}
              </option>
            ))}
            <option value="custom">Another page (type the address)</option>
          </select>
          {preset === "custom" && (
            <input
              value={a.link_url}
              onChange={(e) => set("link_url", e.target.value)}
              placeholder="https://example.com or /artwork/smoke-through-the-giants"
              className="input mt-2"
            />
          )}
          {a.link_url && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={opensInNewTab(a)}
                onChange={(e) => set("new_tab", e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Open in a new tab
              {isExternalLink(a.link_url) && a.new_tab === undefined && (
                <span className="text-xs opacity-65">(automatic for other websites)</span>
              )}
            </label>
          )}
        </div>
        {a.link_url && (
          <div className="field">
            <label htmlFor="linkLabel">Button text</label>
            <input
              id="linkLabel"
              value={a.link_label}
              maxLength={30}
              onChange={(e) => set("link_label", e.target.value)}
              placeholder="Shop the sale"
              className="input"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="start">Starts, Eastern time (optional)</label>
          <input id="start" type="datetime-local" value={toLocalInput(a.starts_at)} onChange={(e) => set("starts_at", fromLocalInput(e.target.value))} className="input" />
          <p className="mt-1 text-xs opacity-65">Empty = shows as soon as you save.</p>
        </div>
        <div className="field">
          <label htmlFor="end">Ends, Eastern time (optional)</label>
          <input id="end" type="datetime-local" value={toLocalInput(a.ends_at)} onChange={(e) => set("ends_at", fromLocalInput(e.target.value))} className="input" />
          <p className="mt-1 text-xs opacity-65">Empty = stays until you turn it off. The banner hides itself at this time.</p>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={a.countdown} onChange={(e) => set("countdown", e.target.checked)} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          Show a countdown to the end (&ldquo;Ends in 2d 14h 06m&rdquo;)
          <span className="mt-0.5 block text-xs opacity-65">
            This only counts down the banner. Sale prices end on each piece&rsquo;s own &ldquo;End sale on&rdquo; date (or never, if left empty).
          </span>
        </span>
      </label>

      <div className="field">
        <span className="field-label">Colour</span>
        <div className="flex gap-3">
          {STYLE_OPTIONS.map((s) => (
            <label key={s.value} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="style" checked={a.style === s.value} onChange={() => set("style", s.value)} className="accent-accent" />
              <span className={`inline-block h-5 w-8 ${s.preview}`} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Preview</span>
        <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-6 py-4 text-center text-base ${styleClass}`}>
          <span className="font-semibold">{a.message || "Your message"}</span>
          {a.countdown && <span className="font-extrabold">Ends in 2d 14h 06m</span>}
          {a.link_url && (
            <span className="inline-flex items-center gap-1 font-extrabold underline underline-offset-4">
              {a.link_label || "Learn more"} <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-4 border-t-2 border-rule bg-paper px-5 py-4 md:-mx-10 md:px-10">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save"} <ArrowRight />
        </button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold underline underline-offset-4">
          Cancel
        </button>
        {message && <span className={`text-sm ${message.ok ? "" : "text-accent-700"}`}>{message.text}</span>}
      </div>
    </form>
  );
}
