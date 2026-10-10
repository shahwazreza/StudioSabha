// The admin lives at a secret address set in the ADMIN_PATH environment
// variable (Vercel settings / .env.local), never in the code, because the
// code is public on GitHub. /admin itself always shows "not found".
// Server-only: never expose ADMIN_PATH to the public site's JavaScript.

const MIN_LENGTH = 12;

// e.g. "studio-k7q9x2m4wz", or null if not set / too weak (admin unreachable).
export function getAdminBase(): string | null {
  const raw = process.env.ADMIN_PATH?.trim().replace(/^\/+|\/+$/g, "");
  if (!raw || raw.length < MIN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  return raw;
}

// "/works" -> "/<secret>/works" (for links rendered on the server).
export function adminHref(sub = ""): string {
  return `/${getAdminBase() ?? "__admin-disabled"}${sub}`;
}
