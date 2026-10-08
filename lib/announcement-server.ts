import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-data";
import { Announcement, readAnnouncements } from "@/lib/announcement";

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isDemoMode) return [];
  const { data, error } = await createClient()
    .from("site_content")
    .select("content")
    .eq("id", "announcement")
    .maybeSingle();
  if (error || !data) return [];
  return readAnnouncements(data.content);
}
