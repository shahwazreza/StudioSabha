import AboutForm from "./AboutForm";
import { getAbout } from "@/lib/about";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const about = await getAbout();

  return (
    <>
      <div className="border-b-2 border-rule px-5 pb-[18px] pt-6 md:px-10 md:pb-6 md:pt-9">
        <div className="kicker mb-1.5">Website</div>
        <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">About</h1>
      </div>
      <div className="px-5 pt-6 md:px-10 md:pt-8">
        <AboutForm initial={about} />
      </div>
    </>
  );
}
