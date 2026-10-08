import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoBanner from "@/components/DemoBanner";
import ImageGuard from "@/components/ImageGuard";
import AnnouncementBar from "@/components/AnnouncementBar";
import { getAnnouncements } from "@/lib/announcement-server";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const announcements = await getAnnouncements();
  return (
    <div className="protect-images flex min-h-screen flex-col">
      <ImageGuard />
      <DemoBanner />
      <AnnouncementBar announcements={announcements} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
