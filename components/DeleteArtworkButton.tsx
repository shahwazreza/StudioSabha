"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { refreshSite } from "@/app/admin/actions";
import { artworkImagePath } from "@/lib/storage-paths";

// Permanently deletes a piece (after confirming) and tidies up its photos.
export default function DeleteArtworkButton({
  id,
  title,
  imageUrls,
  className = "text-sm font-semibold text-accent",
  redirectTo,
}: {
  id: string;
  title: string;
  imageUrls: string[];
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete “${title}” permanently?\n\nThis can’t be undone. To just take it off the site, set its status to Hidden instead.`)) {
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("artworks").delete().eq("id", id);

    if (error) {
      setBusy(false);
      // 23503: orders still point at this piece, so its sales history would break.
      window.alert(
        error.code === "23503"
          ? `“${title}” has orders recorded, so it can’t be deleted. Set its status to Hidden instead.`
          : `Couldn’t delete: ${error.message}`
      );
      return;
    }

    // Remove its photos from storage too (best effort; the piece is already gone).
    const paths = imageUrls.map(artworkImagePath).filter((p): p is string => Boolean(p));
    if (paths.length) {
      // Supabase skips files it isn't allowed to delete without an error, so
      // compare what was actually removed.
      const { data: removed } = await supabase.storage.from("artwork-images").remove(paths);
      if ((removed?.length ?? 0) < paths.length) {
        window.alert(
          `\u201c${title}\u201d was deleted, but its picture couldn\u2019t be removed from storage. ` +
            "Please let your web developer know."
        );
      }
    }
    await refreshSite();

    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleDelete} disabled={busy} className={`${className} disabled:opacity-45`}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
