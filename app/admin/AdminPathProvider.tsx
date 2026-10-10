"use client";

import { createContext, useContext } from "react";

// Gives admin client components the secret admin address. Only rendered
// inside the admin, so the address is never sent to the public site.
const AdminBase = createContext<string>("__admin-disabled");

export function AdminPathProvider({ base, children }: { base: string; children: React.ReactNode }) {
  return <AdminBase.Provider value={base}>{children}</AdminBase.Provider>;
}

export function useAdminPaths() {
  const base = useContext(AdminBase);
  return {
    // "/works" -> "/<secret>/works"
    href: (sub = "") => `/${base}${sub}`,
    // Browser path "/<secret>/works" -> "/works" (for highlighting the menu).
    inner: (pathname: string) => pathname.slice(base.length + 1) || "/",
  };
}
