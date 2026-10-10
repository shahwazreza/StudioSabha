"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAdminPaths } from "./AdminPathProvider";

export default function SignOutButton({ className = "text-sm underline" }: { className?: string }) {
  const router = useRouter();
  const admin = useAdminPaths();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(admin.href("/login"));
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      Sign out
    </button>
  );
}
