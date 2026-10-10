import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminNav from "./AdminNav";
import { AdminPathProvider } from "./AdminPathProvider";
import DemoBanner from "@/components/DemoBanner";
import { getAdminBase } from "@/lib/admin-path";

export const metadata: Metadata = {
  title: "Studio | StudioSabha",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // No secret address configured: the admin doesn't exist.
  const base = getAdminBase();
  if (!base) notFound();

  return (
    <AdminPathProvider base={base}>
      <div className="min-h-screen">
        <DemoBanner />
        <AdminNav />
        <main className="mx-auto max-w-page">{children}</main>
      </div>
    </AdminPathProvider>
  );
}
