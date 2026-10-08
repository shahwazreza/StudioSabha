import Link from "next/link";
import { WorksTable } from "../components";
import { Plus } from "@/components/icons";
import { getAdminWorks } from "@/lib/admin-data";
import { formatCat } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminWorksPage() {
  const works = await getAdminWorks();

  return (
    <>
      <div className="flex flex-col gap-3.5 border-b-2 border-rule px-5 pb-[18px] pt-6 md:flex-row md:items-end md:justify-between md:px-10 md:pb-6 md:pt-9">
        <div>
          <div className="kicker mb-1.5">{formatCat(works.length)} works</div>
          <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">Works</h1>
        </div>
        <Link href="/admin/new" className="btn btn-primary whitespace-nowrap px-4 py-[15px] text-[15px] md:px-[18px] md:py-3.5">
          Add new piece <Plus className="h-4 w-4" />
        </Link>
      </div>
      <div className="px-5 py-5 md:px-10 md:py-7">
        <WorksTable works={works} />
      </div>
    </>
  );
}
