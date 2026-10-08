"use client";

import { useEffect } from "react";

// Discourages casual saving of artwork on the public site: no right-click
// "Save image", no dragging images out of the page. (Phones' long-press menu
// is turned off in CSS via .protect-images.) Determined people can still
// screenshot; the real protection is the small, watermarked public copies.
export default function ImageGuard() {
  useEffect(() => {
    const isImage = (target: EventTarget | null) =>
      target instanceof HTMLImageElement || (target instanceof HTMLElement && target.closest("[data-protect]") !== null);
    const block = (e: Event) => {
      if (isImage(e.target)) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);
  return null;
}
