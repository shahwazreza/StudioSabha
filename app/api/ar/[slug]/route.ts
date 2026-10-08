import { NextRequest, NextResponse } from "next/server";
import { getArtworkBySlug } from "@/lib/artworks";
import { parseSize } from "@/lib/dimensions";
import { buildCanvasGlb } from "@/lib/glb";

// GET /api/ar/<slug>?size=<sizeId> → a .glb of the painting at its real size,
// for "View on your wall". Phones' AR viewers download this URL directly.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const artwork = await getArtworkBySlug(params.slug);
  if (!artwork || !["available", "sold_out", "inquire_only"].includes(artwork.status) || !artwork.image_urls[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sizeId = req.nextUrl.searchParams.get("size");
  const chosen = sizeId ? artwork.sizes?.find((s) => s.id === sizeId) : undefined;
  const real = parseSize(chosen?.label ?? artwork.dimensions ?? artwork.sizes?.[0]?.label);
  if (!real) {
    return NextResponse.json({ error: "This piece has no size set" }, { status: 404 });
  }

  const imageRes = await fetch(artwork.image_urls[0]);
  if (!imageRes.ok) return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
  const image = new Uint8Array(await imageRes.arrayBuffer());
  const isPng = image[0] === 0x89 && image[1] === 0x50;
  const isJpeg = image[0] === 0xff && image[1] === 0xd8;
  if (!isPng && !isJpeg) return NextResponse.json({ error: "Unsupported image" }, { status: 415 });

  const glb = buildCanvasGlb({
    widthM: real.widthM,
    heightM: real.heightM,
    image,
    mimeType: isPng ? "image/png" : "image/jpeg",
  });

  // buildCanvasGlb allocates an exact-size buffer, so it can be sent as-is.
  return new NextResponse(glb.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Disposition": `inline; filename="${artwork.slug}.glb"`,
    },
  });
}
