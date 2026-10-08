import { isDemoMode } from "@/lib/demo-data";

export default function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="bg-ink px-5 py-2 text-xs text-paper md:px-10">
      Demo mode &mdash; showing sample artwork. Connect Supabase, Square, and
      Resend (see README) to go live.
    </div>
  );
}
