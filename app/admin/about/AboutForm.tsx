"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/prepare-image";
import { AboutContent, Exhibition } from "@/lib/about";
import { ArrowRight } from "@/components/icons";
import { refreshSite } from "../actions";
import { artworkImagePath } from "@/lib/storage-paths";

const EMPTY_EXHIBITION: Exhibition = { name: "", place: "", years: "" };

export default function AboutForm({ initial }: { initial: AboutContent }) {
  const supabase = createClient();
  const [about, setAbout] = useState<AboutContent>(initial);
  // The portrait currently live on the site (updated after each save).
  const [savedPortrait, setSavedPortrait] = useState(initial.portrait_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setAbout((a) => ({ ...a, [key]: value }));
    setMessage(null);
  }

  function updateExhibition(i: number, patch: Partial<Exhibition>) {
    set("exhibitions", about.exhibitions.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }

  function moveExhibition(i: number, delta: number) {
    const list = [...about.exhibitions];
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set("exhibitions", list);
  }

  async function uploadPortrait(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const image = await prepareImage(file, 1600);
      const path = `about/${Date.now()}-portrait.jpg`;
      const { error } = await supabase.storage.from("artwork-images").upload(path, image, { contentType: "image/jpeg" });
      if (error) throw error;
      set("portrait_url", supabase.storage.from("artwork-images").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "The photo couldn't be uploaded." });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const content: AboutContent = {
      ...about,
      exhibitions: about.exhibitions.filter((x) => x.name.trim()),
    };
    const { error } = await supabase
      .from("site_content")
      .upsert({ id: "about", content, updated_at: new Date().toISOString() });
    if (error) {
      setMessage({ ok: false, text: error.message });
    } else {
      // A replaced portrait: delete the previous file now that the new one is saved.
      const oldPortrait = artworkImagePath(savedPortrait);
      if (oldPortrait && savedPortrait !== content.portrait_url) {
        await supabase.storage.from("artwork-images").remove([oldPortrait]);
      }
      setSavedPortrait(content.portrait_url);
      await refreshSite();
      setAbout(content);
      setMessage({ ok: true, text: "Saved. The website now shows your changes." });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="flex max-w-3xl flex-col gap-8">
      {/* Portrait */}
      <section className="flex flex-col gap-3">
        <h3 className="m-0 text-xl">Portrait</h3>
        <div className="flex flex-wrap items-end gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={about.portrait_url} alt="" className={`h-40 w-32 object-cover ${about.portrait_grayscale ? "grayscale-photo" : ""}`} />
          <div className="flex flex-col gap-2 text-sm">
            <label className={`btn btn-secondary cursor-pointer px-4 py-2.5 text-sm ${uploading ? "pointer-events-none opacity-45" : ""}`}>
              {uploading ? "Uploading…" : "Replace photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadPortrait(e.target.files?.[0])} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={about.portrait_grayscale}
                onChange={(e) => set("portrait_grayscale", e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Show in black and white
            </label>
            <span className="text-xs opacity-65">Click Save to publish changes to the photo.</span>
          </div>
        </div>
      </section>

      {/* Text */}
      <section className="flex flex-col gap-4 border-t-2 border-rule pt-6">
        <h3 className="m-0 text-xl">Bio</h3>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" required value={about.name} onChange={(e) => set("name", e.target.value)} className="input" />
        </div>
        <div className="field">
          <label htmlFor="intro">Intro line (large text under your name)</label>
          <textarea id="intro" required value={about.intro} onChange={(e) => set("intro", e.target.value)} className="input min-h-[90px]" />
        </div>
        <div className="field">
          <label htmlFor="summary">Short summary (homepage)</label>
          <textarea id="summary" required value={about.summary} onChange={(e) => set("summary", e.target.value)} className="input min-h-[90px]" />
        </div>
        <div className="field">
          <label htmlFor="story">Full story (About page)</label>
          <textarea id="story" required value={about.story} onChange={(e) => set("story", e.target.value)} className="input min-h-[260px]" />
          <p className="mt-1 text-xs opacity-65">Leave an empty line between paragraphs.</p>
        </div>
      </section>

      {/* Exhibitions */}
      <section className="flex flex-col gap-3 border-t-2 border-rule pt-6">
        <h3 className="m-0 text-xl">Exhibitions</h3>
        <p className="m-0 text-xs opacity-65">Shown as a table on the About page and the homepage, in this order.</p>
        {about.exhibitions.map((ex, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 border-t border-rule pt-3 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end">
            <div className="field">
              <label>Exhibition</label>
              <input value={ex.name} onChange={(e) => updateExhibition(i, { name: e.target.value })} className="input" />
            </div>
            <div className="field">
              <label>Where</label>
              <input value={ex.place} onChange={(e) => updateExhibition(i, { place: e.target.value })} className="input" />
            </div>
            <div className="field">
              <label>Year(s)</label>
              <input value={ex.years} onChange={(e) => updateExhibition(i, { years: e.target.value })} className="input" />
            </div>
            <div className="flex gap-1 pb-1 text-sm">
              <button type="button" onClick={() => moveExhibition(i, -1)} disabled={i === 0} className="px-2 py-2 disabled:opacity-30" aria-label="Move up">↑</button>
              <button type="button" onClick={() => moveExhibition(i, 1)} disabled={i === about.exhibitions.length - 1} className="px-2 py-2 disabled:opacity-30" aria-label="Move down">↓</button>
              <button
                type="button"
                onClick={() => set("exhibitions", about.exhibitions.filter((_, j) => j !== i))}
                className="px-2 py-2 font-semibold text-accent"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("exhibitions", [...about.exhibitions, { ...EMPTY_EXHIBITION }])}
          className="btn btn-secondary self-start px-4 py-2.5 text-sm"
        >
          + Add exhibition
        </button>
      </section>

      {/* Highlights */}
      <section className="flex flex-col gap-3 border-t-2 border-rule pt-6">
        <h3 className="m-0 text-xl">Homepage highlights</h3>
        <p className="m-0 text-xs opacity-65">The four boxes under the big headline on the homepage.</p>
        {about.highlights.map((h, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 border-t border-rule pt-3 sm:grid-cols-[140px_1fr_1fr]">
            <div className="field">
              <label>Small label</label>
              <input
                value={h.kicker}
                onChange={(e) => set("highlights", about.highlights.map((x, j) => (j === i ? { ...x, kicker: e.target.value } : x)))}
                className="input"
                placeholder="Award"
              />
            </div>
            <div className="field">
              <label>Title</label>
              <input
                value={h.title}
                onChange={(e) => set("highlights", about.highlights.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                className="input"
              />
            </div>
            <div className="field">
              <label>Detail</label>
              <input
                value={h.detail}
                onChange={(e) => set("highlights", about.highlights.map((x, j) => (j === i ? { ...x, detail: e.target.value } : x)))}
                className="input"
              />
            </div>
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-4 border-t-2 border-rule bg-paper px-5 py-4 md:-mx-10 md:px-10">
        <button type="submit" disabled={saving || uploading} className="btn btn-primary">
          {saving ? "Saving…" : "Save"} <ArrowRight />
        </button>
        {message && <span className={`text-sm ${message.ok ? "" : "text-accent-700"}`}>{message.text}</span>}
        <a href="/about" target="_blank" rel="noopener noreferrer" className="ml-auto text-sm">
          View About page ↗
        </a>
      </div>
    </form>
  );
}
