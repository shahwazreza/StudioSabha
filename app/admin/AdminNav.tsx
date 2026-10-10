"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark, Close, Menu } from "@/components/icons";
import SignOutButton from "./SignOutButton";
import { useAdminPaths } from "./AdminPathProvider";

// Paths are relative to the secret admin address.
const LINKS = [
  { href: "", label: "Overview" },
  { href: "/works", label: "Works" },
  { href: "/orders", label: "Orders" },
  { href: "/inquiries", label: "Inquiries" },
  { href: "/announcement", label: "Announcements" },
  { href: "/about", label: "About" },
];

// `page` is the path inside the admin, e.g. "/works" or "/" for the overview.
function isCurrent(page: string, href: string) {
  if (href === "") return page === "/";
  if (href === "/works") return page.startsWith("/works") || page === "/new" || page.endsWith("/edit");
  return page.startsWith(href);
}

export default function AdminNav() {
  const pathname = usePathname();
  const admin = useAdminPaths();
  const page = admin.inner(pathname);
  const [open, setOpen] = useState(false);
  const isLogin = page === "/login";

  useEffect(() => setOpen(false), [pathname]);

  const linkClass = "text-paper no-underline hover:text-accent aria-[current=page]:text-accent";

  return (
    <header className="bg-ink text-paper">
      <nav className="flex items-center gap-7 px-5 py-3.5 md:px-10 md:py-4">
        <Link href={admin.href()} className="mr-auto flex items-center gap-2.5 text-base font-extrabold text-paper no-underline md:text-lg">
          <BrandMark size={12} />
          <span className="md:hidden">STUDIO</span>
          <span className="hidden md:inline">
            STUDIOSABHA <span className="text-sm font-normal opacity-60">/ Studio</span>
          </span>
        </Link>

        {!isLogin && (
          <>
            <div className="hidden items-center gap-7 text-sm md:flex">
              {LINKS.map((l) => (
                <Link key={l.href} href={admin.href(l.href)} aria-current={isCurrent(page, l.href) ? "page" : undefined} className={linkClass}>
                  {l.label}
                </Link>
              ))}
              <a href="/" target="_blank" rel="noopener noreferrer" className={`${linkClass} opacity-60`}>
                View site ↗
              </a>
              <SignOutButton className="text-sm text-paper opacity-60 hover:text-accent hover:opacity-100" />
            </div>
            <button
              type="button"
              className="md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </>
        )}
      </nav>

      {open && !isLogin && (
        <div className="border-t border-paper/20 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isCurrent(pathname, l.href) ? "page" : undefined}
              className={`block border-b border-paper/20 px-5 py-3.5 text-lg font-extrabold ${linkClass}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-6 px-5 py-3.5 text-sm">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-paper no-underline opacity-70">
              View site ↗
            </a>
            <SignOutButton className="text-sm text-paper opacity-70" />
          </div>
        </div>
      )}
    </header>
  );
}
