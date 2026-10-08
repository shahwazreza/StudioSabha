// Reads a painting's real size from the text she types, e.g. "18 x 24 in",
// "18 × 24 inches", "45 x 60 cm", "18" x 24"". Width comes first. With no
// unit, inches are assumed. Used to show the painting at true size in AR.

export type RealSize = { widthM: number; heightM: number };

const UNIT_TO_M: Record<string, number> = {
  in: 0.0254,
  inch: 0.0254,
  inches: 0.0254,
  '"': 0.0254,
  "”": 0.0254,
  cm: 0.01,
  mm: 0.001,
  m: 1,
  ft: 0.3048,
  feet: 0.3048,
};

export function parseSize(text: string | null | undefined): RealSize | null {
  if (!text) return null;
  const match = text
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*("|”|in|cm|mm)?\s*(?:x|×|by|\*)\s*(\d+(?:\.\d+)?)\s*(inches|inch|in|"|”|cm|mm|m|ft|feet)?/);
  if (!match) return null;
  const [, w, unitA, h, unitB] = match;
  const unit = UNIT_TO_M[unitB ?? unitA ?? "in"] ?? UNIT_TO_M.in;
  const widthM = parseFloat(w) * unit;
  const heightM = parseFloat(h) * unit;
  // Ignore anything implausible for a wall piece (under 2 cm or over 6 m).
  if (!(widthM >= 0.02 && heightM >= 0.02 && widthM <= 6 && heightM <= 6)) return null;
  return { widthM, heightM };
}
