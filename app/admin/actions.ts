"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Called after the artist saves something in /admin, so the public pages
// show the change right away instead of within the next minute.
export async function refreshSite() {
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user) return;
  revalidatePath("/", "layout");
}
