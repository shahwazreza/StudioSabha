"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { BrandMark, Close, Menu } from "@/components/icons";

function isCurrent(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  // Artwork pages belong to the Shop.
  if (href === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/artwork");
  return pathname.startsWith(href);
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the phone menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="border-b-2 border-rule">
      <nav className="mx-auto flex max-w-page items-center gap-8 px-5 py-4 md:px-10 md:py-5">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2.5 text-[17px] font-extrabold tracking-[-0.02em] text-ink no-underline md:text-xl"
        >
          <BrandMark />
          STUDIOSABHA
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className="text-sm text-ink no-underline hover:text-accent aria-[current=page]:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-ink no-underline opacity-70 hover:text-accent hover:opacity-100"
          >
            @{INSTAGRAM_HANDLE}
          </a>
        </div>

        <button
          type="button"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <Close /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t-2 border-rule md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
              className="block border-b border-rule px-5 py-4 text-2xl font-extrabold tracking-[-0.03em] text-ink no-underline aria-[current=page]:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-5 py-4 text-sm text-ink no-underline opacity-70"
          >
            @{INSTAGRAM_HANDLE} on Instagram
          </a>
        </div>
      )}
    </header>
  );
}
