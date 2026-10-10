import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminBase } from "@/lib/admin-path";

// The admin is only reachable at its secret address (ADMIN_PATH), which is
// quietly mapped to the real /admin pages. /admin itself shows "not found",
// as if there were no admin. Pages other than login also require Sabha's
// login, checked against the admin list in the database.
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const base = getAdminBase();
  const notFound = () => NextResponse.rewrite(new URL("/__not-found", req.url));

  // Direct visits to /admin: pretend it doesn't exist.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return notFound();

  const onSecretPath = base && (pathname === `/${base}` || pathname.startsWith(`/${base}/`));
  if (!onSecretPath) return NextResponse.next();

  const inner = "/admin" + pathname.slice(base.length + 1); // "/admin" or "/admin/works"
  const res = NextResponse.rewrite(new URL(inner + search, req.url));
  if (inner === "/admin/login") return res;

  // Demo mode (no Supabase): nothing to check against.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => res.cookies.set({ name, value, ...options }),
        remove: (name: string, options: CookieOptions) => res.cookies.set({ name, value: "", ...options }),
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/${base}/login`, req.url));

  // Logged in, but is it Sabha? (Fails closed if the check can't run.)
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) return notFound();

  return res;
}

export const config = {
  // Runs on page requests only (not static files, images or API routes).
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|images/|room-templates/).*)"],
};
