import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components (e.g. the admin login form, admin dashboard interactions).
// Falls back to harmless placeholder values when no real Supabase project is
// configured yet, so the app can still boot in demo mode instead of crashing.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key"
  );
}
