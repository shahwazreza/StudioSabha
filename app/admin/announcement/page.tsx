import AnnouncementsManager from "./AnnouncementsManager";
import { getAnnouncements } from "@/lib/announcement-server";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementPage() {
  const announcements = await getAnnouncements();

  return (
    <>
      <div className="border-b-2 border-rule px-5 pb-[18px] pt-6 md:px-10 md:pb-6 md:pt-9">
        <div className="kicker mb-1.5">Website</div>
        <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">Announcements</h1>
        <p className="m-0 mt-2 max-w-prose text-sm opacity-65">
          Banners across the top of the homepage, for sales, new work, events or studio news. When several are live, they stack, newest on top.
        </p>
      </div>
      <div className="px-5 pt-6 md:px-10 md:pt-8">
        <AnnouncementsManager initial={announcements} />
      </div>
    </>
  );
}
