// Browser-only: re-draws a photo onto a canvas and exports a JPEG. This shrinks
// phone photos to a web-friendly size and drops hidden metadata (including
// GPS location), for both the artist's uploads and visitors' reference photos.
export async function prepareImage(file: File, maxEdge = 2400, quality = 0.85): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`"${file.name}" couldn't be read. Please use a JPG or PNG photo.`);
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error(`Couldn't process "${file.name}".`))),
      "image/jpeg",
      quality
    )
  );
}

// The copy of an artwork photo the site stores and shows: capped at
// DISPLAY_MAX_EDGE, a faint "© Sabha Sumaiya" in the bottom-right corner, and
// copyright info embedded. (Full-size originals aren't uploaded.)
export async function prepareDisplayCopy(file: File): Promise<Blob> {
  const { DISPLAY_MAX_EDGE, DISPLAY_QUALITY, WATERMARK_TEXT, addCopyrightExif } = await import("@/lib/image-protect");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`"${file.name}" couldn't be read. Please use a JPG or PNG photo.`);
  }
  const scale = Math.min(1, DISPLAY_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  drawWatermark(ctx, canvas.width, canvas.height, WATERMARK_TEXT);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`Couldn't process "${file.name}".`))), "image/jpeg", DISPLAY_QUALITY)
  );
  const tagged = addCopyrightExif(new Uint8Array(await blob.arrayBuffer()));
  return new Blob([tagged.buffer as ArrayBuffer], { type: "image/jpeg" });
}

// Same look as the one-off script used for the existing images: white text
// at ~55% with a soft dark edge so it reads on light and dark paintings.
function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
  const size = Math.max(12, Math.round(Math.max(w, h) * 0.02));
  const margin = Math.round(size * 0.9);
  ctx.font = `600 ${size}px "Liberation Sans", Arial, Helvetica, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillText(text, w - margin + 1, h - margin + 1);
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.fillText(text, w - margin, h - margin);
}

// "Painting on a wall": draws the painting (whole, on a mat) into the green
// area of the matching room photo, then watermarks and tags it like every
// other image. `artUrl` must allow cross-origin reads (Supabase storage does).
export async function createWallPhoto(artUrl: string): Promise<Blob> {
  const { pickTemplate, layoutWallPhoto } = await import("@/lib/room-templates");
  const { DISPLAY_QUALITY, WATERMARK_TEXT, addCopyrightExif } = await import("@/lib/image-protect");

  const load = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Couldn't load the painting's photo."));
      img.src = src;
    });

  const art = await load(artUrl);
  const template = pickTemplate(art.naturalWidth, art.naturalHeight);
  const room = await load(template.file);
  const { mat, art: spot } = layoutWallPhoto(template, art.naturalWidth, art.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(room, 0, 0);
  ctx.fillStyle = template.mat;
  ctx.fillRect(mat.x, mat.y, mat.w, mat.h);
  // A soft shadow so the painting sits recessed in the mat opening.
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.drawImage(art, spot.x, spot.y, spot.w, spot.h);
  ctx.restore();
  drawWatermark(ctx, canvas.width, canvas.height, WATERMARK_TEXT);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create the wall photo."))), "image/jpeg", DISPLAY_QUALITY)
  );
  const tagged = addCopyrightExif(new Uint8Array(await blob.arrayBuffer()));
  return new Blob([tagged.buffer as ArrayBuffer], { type: "image/jpeg" });
}
