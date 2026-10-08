"use client";

import { useEffect, useRef, useState } from "react";

type ModelViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR: () => Promise<void>;
};

// "View on your wall": on phones that support AR (iPhone AR Quick Look,
// Android Scene Viewer / WebXR) the camera opens and the painting hangs on
// the visitor's wall at its true size. The 3D model comes from /api/ar/<slug>.
// On other devices we just say how to try it.
export default function ViewOnWall({
  slug,
  title,
  sizeId,
}: {
  slug: string;
  title: string;
  sizeId?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const viewer = useRef<ModelViewerElement | null>(null);
  // desktop: no camera AR, so just a hint. insecure: phones only allow AR
  // on https pages (e.g. testing over a local http address). unsupported: a
  // phone whose browser can't do AR.
  const [state, setState] = useState<"checking" | "loading" | "ready" | "desktop" | "insecure" | "unsupported">("checking");
  const [error, setError] = useState<string | null>(null);
  const src = `/api/ar/${slug}${sizeId ? `?size=${encodeURIComponent(sizeId)}` : ""}`;

  // Load Google's <model-viewer> (only on this page) and keep one hidden
  // instance ready to launch AR.
  useEffect(() => {
    let cancelled = false;
    const isPhone =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1); // iPadOS
    if (!isPhone) {
      setState("desktop");
      return;
    }
    if (!window.isSecureContext) {
      setState("insecure");
      return;
    }
    import("@google/model-viewer").then(() => {
      if (cancelled || !holder.current) return;
      const el = document.createElement("model-viewer") as ModelViewerElement;
      el.setAttribute("ar", "");
      el.setAttribute("ar-modes", "webxr scene-viewer quick-look");
      el.setAttribute("ar-placement", "wall");
      el.setAttribute("ar-scale", "fixed"); // keep it at true size
      el.setAttribute("loading", "eager");
      el.setAttribute("alt", title);
      // Invisible but "on screen": model-viewer waits to load models that are
      // outside the viewport.
      el.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;";
      el.addEventListener("load", () => !cancelled && setState(el.canActivateAR ? "ready" : "unsupported"));
      el.addEventListener("error", () => !cancelled && setState("unsupported"));
      holder.current.appendChild(el);
      viewer.current = el;
      // The browser's AR check finishes asynchronously, so decide once the
      // model has loaded (the "load" listener above).
      setState("loading");
      el.setAttribute("src", src);
    });
    // Never leave the button stuck on "Preparing…".
    const giveUp = setTimeout(() => {
      if (!cancelled) setState((s) => (s === "loading" ? "unsupported" : s));
    }, 25000);
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      viewer.current?.remove();
      viewer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, title]);

  // A different size was chosen: load that size's model.
  useEffect(() => {
    const el = viewer.current;
    if (!el || el.getAttribute("src") === src) return;
    setState("loading");
    el.setAttribute("src", src);
  }, [src]);

  async function launch() {
    setError(null);
    try {
      await viewer.current?.activateAR();
    } catch {
      setError("Couldn't open the camera view on this device.");
    }
  }

  return (
    <div ref={holder} className="relative">
      {state !== "loading" && state !== "ready" ? (
        <p className="m-0 flex items-center gap-2 text-[13px] opacity-65">
          <WallIcon />
          {state === "checking" && " "}
          {state === "desktop" && "Open this page on your phone to see it on your wall at real size."}
          {state === "insecure" && "Wall view needs a secure (https) connection. It will work on the live site."}
          {state === "unsupported" && "Wall view isn’t available in this browser. Try Safari on iPhone or Chrome on Android."}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={launch}
            disabled={state !== "ready"}
            className="btn btn-secondary w-full py-3.5 text-[15px]"
          >
            <span className="flex items-center gap-2.5">
              <WallIcon />
              {state === "ready" ? "View on your wall" : "Preparing wall view…"}
            </span>
            <span className="text-xs font-semibold opacity-65">Real size</span>
          </button>
          {error && <p className="m-0 mt-1.5 text-sm text-accent-700">{error}</p>}
        </>
      )}
    </div>
  );
}

function WallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
      <rect x="5" y="4" width="14" height="11" />
      <path d="M9 4 12 1l3 3" />
      <path d="M3 21h18" />
      <path d="M12 15v3" />
    </svg>
  );
}
