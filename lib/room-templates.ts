// Room photos used for "painting on a wall" images. Each has a green
// placeholder inside its frame (measured once; see public/room-templates).
// The painting is shown whole inside that area on an even mat, never cropped.
// Shared by the admin "Create wall photo" button and the one-off batch script.

export type RoomTemplate = {
  file: string; // under /public
  width: number;
  height: number;
  box: { x: number; y: number; w: number; h: number }; // the green area
  mat: string; // mat colour filling the space around the painting
};

export const ROOM_TEMPLATES: Record<"tall" | "square" | "wide", RoomTemplate> = {
  tall: { file: "/room-templates/tall.jpg", width: 989, height: 1400, box: { x: 343, y: 268, w: 303, h: 445 }, mat: "#f2efe9" },
  square: { file: "/room-templates/square.jpg", width: 1080, height: 1080, box: { x: 355, y: 132, w: 368, h: 368 }, mat: "#f2efe9" },
  wide: { file: "/room-templates/wide.jpg", width: 1080, height: 1080, box: { x: 233, y: 143, w: 411, h: 287 }, mat: "#f2efe9" },
};

// File names of wall photos contain this, so the site can label them.
export const WALL_PHOTO_MARKER = "-wall";
export const isWallPhoto = (url: string) => url.includes(`${WALL_PHOTO_MARKER}.jpg`);

export function pickTemplate(width: number, height: number) {
  const ratio = width / height;
  if (ratio < 0.85) return ROOM_TEMPLATES.tall;
  if (ratio <= 1.15) return ROOM_TEMPLATES.square;
  return ROOM_TEMPLATES.wide;
}

// Where everything goes, in template pixels:
// - `mat`: the green area, grown by a few pixels so no green fringe survives
// - `art`: the painting, fitted whole inside the mat with an even margin
export function layoutWallPhoto(t: RoomTemplate, artWidth: number, artHeight: number) {
  const bleed = 3;
  const mat = { x: t.box.x - bleed, y: t.box.y - bleed, w: t.box.w + bleed * 2, h: t.box.h + bleed * 2 };
  const margin = Math.round(Math.min(t.box.w, t.box.h) * 0.06);
  const maxW = t.box.w - margin * 2;
  const maxH = t.box.h - margin * 2;
  const scale = Math.min(maxW / artWidth, maxH / artHeight);
  const w = Math.round(artWidth * scale);
  const h = Math.round(artHeight * scale);
  const art = { x: t.box.x + Math.round((t.box.w - w) / 2), y: t.box.y + Math.round((t.box.h - h) / 2), w, h };
  return { mat, art };
}
