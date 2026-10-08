import { InquiryCard } from "../components";
import { getAdminInquiries } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await getAdminInquiries();
  const open = inquiries.filter((i) => !i.replied_at);
  const replied = inquiries.filter((i) => i.replied_at);

  return (
    <>
      <div className="border-b-2 border-rule px-5 pb-[18px] pt-6 md:px-10 md:pb-6 md:pt-9">
        <div className="kicker mb-1.5">{open.length} need a reply</div>
        <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">Inquiries</h1>
      </div>
      <div className="grid grid-cols-1 gap-x-10 px-5 py-5 md:grid-cols-2 md:px-10 md:py-7">
        <section>
          <h3 className="mb-2.5 text-xl md:text-2xl">New</h3>
          {open.length ? open.map((i) => <InquiryCard key={i.id} inquiry={i} full />) : (
            <p className="border-t-2 border-rule py-4 opacity-65">All caught up.</p>
          )}
        </section>
        <section className="mt-8 md:mt-0">
          <h3 className="mb-2.5 text-xl md:text-2xl">Replied</h3>
          {replied.length ? replied.map((i) => <InquiryCard key={i.id} inquiry={i} full />) : (
            <p className="border-t-2 border-rule py-4 opacity-65">Nothing here yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
