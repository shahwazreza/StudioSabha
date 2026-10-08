"use client";

import { useState } from "react";
import { isDemoMode } from "@/lib/demo-data";
import { prepareImage } from "@/lib/prepare-image";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { InquiryType } from "@/lib/types";
import { ArrowRight } from "@/components/icons";

const MAX_PHOTOS = 5;

const TYPE_OPTIONS: { value: InquiryType; label: string; short: string }[] = [
  { value: "commission", label: "Commission", short: "Commission" },
  { value: "listed_piece", label: "A listed piece", short: "A piece" },
  { value: "question", label: "General question", short: "Question" },
];

export default function ContactForm({
  defaultType,
  artwork,
}: {
  defaultType: InquiryType;
  artwork?: { id: string; title: string };
}) {
  const [type, setType] = useState<InquiryType>(defaultType);
  const [photos, setPhotos] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    setPhotos((current) => [...current, ...Array.from(list)].slice(0, MAX_PHOTOS));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    if (isDemoMode) {
      setStatus("sent");
      return;
    }

    try {
      const form = new FormData(e.currentTarget);
      form.set("inquiry_type", type);
      if (artwork && type === "listed_piece") form.set("artwork_id", artwork.id);
      form.delete("photos");
      if (type === "commission") {
        for (const file of photos) {
          // Shrink to ~1600px so five photos stay well under upload limits.
          form.append("photos", await prepareImage(file, 1600, 0.82), "reference.jpg");
        }
      }
      const res = await fetch("/api/contact", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong sending your message. Please try again.");
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("idle");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col gap-3 border-2 border-rule p-6">
        <div className="kicker">Sent</div>
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em]">Thank you &mdash; your message is on its way to Sabha.</p>
        <p className="m-0 text-sm opacity-65">
          {isDemoMode
            ? "Demo mode: nothing was actually sent."
            : "She'll reply to the email address you gave."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
      <div className="field">
        <span className="field-label">What&rsquo;s this about?</span>
        <div className="seg flex" role="radiogroup">
          {TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="seg-opt flex-1 px-2 py-3 md:py-[9px]">
              <input
                type="radio"
                name="type_choice"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
              />
              <span className="md:hidden">{option.short}</span>
              <span className="hidden md:inline">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {artwork && type === "listed_piece" && (
        <div className="flex items-baseline gap-3 border-t-2 border-rule pt-2.5 text-sm">
          <span className="font-extrabold text-accent">About</span>
          <span className="font-semibold">{artwork.title}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required maxLength={100} autoComplete="name" className="input" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className="input" />
        </div>
      </div>

      {type === "commission" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="field">
            <label htmlFor="subject">Subject</label>
            <input id="subject" name="subject" maxLength={150} placeholder="Portrait, place, pet…" className="input" />
          </div>
          <div className="field">
            <label htmlFor="rough_size">Rough size</label>
            <input id="rough_size" name="rough_size" maxLength={60} placeholder="e.g. 18 × 24 in" className="input" />
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="message">{type === "commission" ? "Tell Sabha about it" : "Message"}</label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          className="input"
          placeholder={
            type === "commission"
              ? "Who or what, the feeling you want, where it will hang, and any deadline."
              : undefined
          }
        />
      </div>

      {type === "commission" && (
        <div className="flex flex-col gap-3 border-2 border-dashed border-rule p-[18px] text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>
              <b>Reference photos</b>
              <br />
              <span className="opacity-65">Optional. Up to {MAX_PHOTOS} images.</span>
            </span>
            <label className={`btn btn-secondary cursor-pointer px-3 py-2 text-sm ${photos.length >= MAX_PHOTOS ? "pointer-events-none opacity-45" : ""}`}>
              Add photos
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {photos.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {photos.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 border-t border-rule pt-1">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    className="text-[13px] font-semibold text-accent"
                    onClick={() => setPhotos((current) => current.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p className="m-0 text-sm text-accent-700">{error}</p>}

      <button type="submit" disabled={status === "sending"} className="btn btn-primary py-[18px] text-[17px]">
        {status === "sending" ? "Sending…" : "Send to Sabha"} <ArrowRight />
      </button>
      <p className="m-0 text-xs opacity-65">
        You can also DM{" "}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          @{INSTAGRAM_HANDLE}
        </a>
        .
      </p>
    </form>
  );
}
