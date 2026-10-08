import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";

// The About content the artist edits in /admin/about. Stored as one JSON row
// in the site_content table; these defaults are what the site shows until
// she saves her own version (and fill in any field that's missing).

export type Exhibition = { name: string; place: string; years: string };
export type Highlight = { kicker: string; title: string; detail: string };

export type AboutContent = {
  name: string;
  intro: string; // the large line under her name
  summary: string; // short paragraph on the homepage
  story: string; // About page; a blank line starts a new paragraph
  portrait_url: string;
  portrait_grayscale: boolean; // show the portrait in black and white
  exhibitions: Exhibition[];
  highlights: Highlight[]; // the boxes under the homepage headline
};

export const DEFAULT_ABOUT: AboutContent = {
  name: "Sabha Sumaiya",
  intro:
    "Sabha started painting at four. She makes hyper-realistic scenes of everyday life, rooted in a deep connection to nature.",
  summary:
    "In 2015 she won Best Landscape at the 5th Tone International Miniature Art Biennale. She has exhibited across Bangladesh and the United States.",
  story: [
    "Known for her hyper-realistic style, she captures everyday scenes with striking detail and emotional depth. Working primarily with acrylics, her work reflects a deep connection to nature and the importance of the environment.",
    "In 2015, Sabha’s talent was recognized with the “Best Landscape” award at the 5th Tone International Miniature Art Biennale. That same year, she achieved the highest national score in Oxford O Level Art & Design in Bangladesh, establishing herself as a rising star in the art world.",
    "Through her mastery of hyper-realism and her skilled use of acrylics, Sabha’s work continues to captivate audiences, offering an intimate exploration of life’s beauty and complexity.",
  ].join("\n\n"),
  portrait_url: "/images/sabha-sumaiya.jpg",
  portrait_grayscale: true,
  exhibitions: [
    { name: "Miami Watercolor Society Exhibition", place: "Miami", years: "2024, 2025" },
    { name: "A Thousand Tales", place: "Bangladesh", years: "2017, 2019, 2024" },
    { name: "Jolkonna", place: "Bangladesh", years: "2019" },
    { name: "Borough of Manhattan Community College", place: "New York", years: "2019" },
    { name: "5th Tone International Miniature Art Biennale", place: "Bangladesh", years: "2015" },
  ],
  highlights: [
    { kicker: "Award", title: "Best Landscape", detail: "5th Tone Intl. Miniature Art Biennale, 2015" },
    { kicker: "Miami", title: "Miami Watercolor Society", detail: "Fall 2024, Fall 2025" },
    { kicker: "New York", title: "BMCC Exhibition", detail: "2019" },
    { kicker: "Bangladesh", title: "A Thousand Tales", detail: "2017, 2019, 2024" },
  ],
};

// Saved values win; anything blank or missing falls back to the default.
export function withDefaults(saved: Partial<AboutContent> | null | undefined): AboutContent {
  const merged = { ...DEFAULT_ABOUT };
  if (!saved) return merged;
  for (const key of ["name", "intro", "summary", "story", "portrait_url"] as const) {
    const value = saved[key];
    if (typeof value === "string" && value.trim()) merged[key] = value;
  }
  if (typeof saved.portrait_grayscale === "boolean") merged.portrait_grayscale = saved.portrait_grayscale;
  if (Array.isArray(saved.exhibitions)) merged.exhibitions = saved.exhibitions.filter((e) => e?.name?.trim());
  if (Array.isArray(saved.highlights)) merged.highlights = saved.highlights.filter((h) => h?.title?.trim());
  return merged;
}

export async function getAbout(): Promise<AboutContent> {
  if (isDemoMode) return DEFAULT_ABOUT;
  const { data, error } = await createClient()
    .from("site_content")
    .select("content")
    .eq("id", "about")
    .maybeSingle();
  // Before the table exists (or if anything goes wrong) the site still works.
  if (error) return DEFAULT_ABOUT;
  return withDefaults(data?.content as Partial<AboutContent> | undefined);
}

export function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
