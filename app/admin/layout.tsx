import type { Metadata } from "next";
import AdminNav from "./AdminNav";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "Studio | StudioSabha",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <DemoBanner />
      <AdminNav />
      <main className="mx-auto max-w-page">{children}</main>
    </div>
  );
}
