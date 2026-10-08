"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { INQUIRY_TYPE_LABELS, InquiryType } from "@/lib/types";

export default function InquiryActions({
  inquiry,
}: {
  inquiry: {
    id: string;
    name: string;
    email: string;
    subject: string | null;
    type: InquiryType;
    replied: boolean;
    referencePaths: string[];
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const mailSubject = `Re: ${inquiry.subject ?? `your ${INQUIRY_TYPE_LABELS[inquiry.type]?.toLowerCase() ?? "message"}`} — StudioSabha`;
  const mailto = `mailto:${inquiry.email}?subject=${encodeURIComponent(mailSubject)}`;

  async function toggleReplied() {
    setSaving(true);
    await createClient()
      .from("inquiries")
      .update({ replied_at: inquiry.replied ? null : new Date().toISOString() })
      .eq("id", inquiry.id);
    setSaving(false);
    router.refresh();
  }

  // Permanently removes the inquiry and any reference photos attached to it.
  async function remove() {
    if (!window.confirm(`Delete the message from ${inquiry.name} permanently?\n\nThis can\u2019t be undone.`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { data: deleted, error } = await supabase.from("inquiries").delete().eq("id", inquiry.id).select("id");
    if (error || !deleted?.length) {
      setDeleting(false);
      window.alert("This message couldn\u2019t be deleted. Please let your web developer know.");
      return;
    }
    if (inquiry.referencePaths.length) {
      const { data: removed } = await supabase.storage.from("inquiry-references").remove(inquiry.referencePaths);
      if ((removed?.length ?? 0) < inquiry.referencePaths.length) {
        window.alert("The message was deleted, but its photos couldn\u2019t be removed. Please let your web developer know.");
      }
    }
    router.refresh();
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] font-semibold">
      <a href={mailto}>Reply by email →</a>
      <button type="button" onClick={toggleReplied} disabled={saving} className="text-ink/70 hover:text-ink disabled:opacity-45">
        {inquiry.replied ? "Mark as new" : "Mark as replied"}
      </button>
      <button type="button" onClick={remove} disabled={deleting} className="text-accent hover:text-accent-700 disabled:opacity-45">
        {deleting ? "Deleting\u2026" : "Delete"}
      </button>
    </div>
  );
}
