import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { INQUIRY_TYPE_LABELS, InquiryType } from "@/lib/types";

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // photos are shrunk in the browser first
const TYPES: InquiryType[] = ["commission", "listed_piece", "question"];

function text(form: FormData, key: string, max: number) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isJpeg(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  // Honeypot: real visitors never see or fill this field; bots usually do.
  if (text(form, "website", 200)) return NextResponse.json({ ok: true });

  const name = text(form, "name", 100);
  const email = text(form, "email", 200);
  const message = text(form, "message", 5000);
  const subject = text(form, "subject", 150) || null;
  const roughSize = text(form, "rough_size", 60) || null;
  const typeRaw = text(form, "inquiry_type", 20) as InquiryType;
  const inquiryType: InquiryType = TYPES.includes(typeRaw) ? typeRaw : "question";
  const artworkIdRaw = text(form, "artwork_id", 36);
  const artworkId = /^[0-9a-f-]{36}$/i.test(artworkIdRaw) ? artworkIdRaw : null;

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please fill in your name, a valid email and a message." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Light rate limit: at most 3 messages per email address every 10 minutes.
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", tenMinutesAgo);
  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "You've sent a few messages already. Please wait a little and try again." }, { status: 429 });
  }

  // Reference photos: commissions only, JPEG only (the form converts them).
  const files = inquiryType === "commission"
    ? form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0)
    : [];
  if (files.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Please attach at most ${MAX_PHOTOS} photos.` }, { status: 400 });
  }

  const referencePaths: string[] = [];
  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "One of the photos is too large." }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isJpeg(bytes)) {
      return NextResponse.json({ error: "Photos must be images." }, { status: 400 });
    }
    const path = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("inquiry-references")
      .upload(path, bytes, { contentType: "image/jpeg" });
    if (error) {
      console.error("Reference photo upload failed:", error.message);
      return NextResponse.json({ error: "Your photos couldn't be uploaded. Please try again." }, { status: 500 });
    }
    referencePaths.push(path);
  }

  const { error: insertError } = await supabase.from("inquiries").insert({
    name,
    email,
    message,
    artwork_id: artworkId,
    inquiry_type: inquiryType,
    subject,
    rough_size: roughSize,
    reference_paths: referencePaths,
  });
  if (insertError) {
    console.error("Inquiry insert failed:", insertError.message);
    return NextResponse.json({ error: "Something went wrong sending your message. Please try again." }, { status: 500 });
  }

  // Email is a convenience on top of the saved inquiry; skip it until Resend is set up.
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.ARTIST_NOTIFY_EMAIL) {
    let artworkLine = "";
    if (artworkId) {
      const { data: artwork } = await supabase
        .from("artworks")
        .select("title, catalogue_number")
        .eq("id", artworkId)
        .maybeSingle();
      if (artwork) artworkLine = `About: Cat. ${artwork.catalogue_number ?? "?"}, ${artwork.title}\n`;
    }
    const header = [
      `${INQUIRY_TYPE_LABELS[inquiryType]} from ${name} <${email}>`,
      artworkLine.trim(),
      subject ? `Subject: ${subject}` : "",
      roughSize ? `Rough size: ${roughSize}` : "",
      referencePaths.length ? `Reference photos: ${referencePaths.length} (view them in the studio admin under Inquiries)` : "",
    ].filter(Boolean);

    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: process.env.ARTIST_NOTIFY_EMAIL,
        reply_to: email,
        subject: `${INQUIRY_TYPE_LABELS[inquiryType]}: ${subject ?? `message from ${name}`}`,
        text: `${header.join("\n")}\n\n${message}`,
      });
    } catch (err) {
      // The inquiry is already saved, so nothing is lost; she'll see it in /admin.
      console.error("Resend send failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
