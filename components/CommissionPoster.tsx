import Link from "next/link";
import { ArrowRight } from "@/components/icons";

// The red "poster" banner that closes the home page.
export default function CommissionPoster() {
  return (
    <section className="bg-accent text-paper">
      <div className="mx-auto grid max-w-page grid-cols-1 items-end gap-5 px-5 py-8 md:grid-cols-[8fr_4fr] md:gap-10 md:px-10 md:pb-10 md:pt-14">
        <h2 className="m-0 text-[60px] leading-[0.86] tracking-[-0.05em] text-paper md:text-[96px] xl:text-[132px]">
          Your wall. Her drawing.
        </h2>
        <div className="flex flex-col gap-3.5">
          <p className="m-0 text-base">
            Commissions are welcome. Share your idea and reference photos to
            get started.
          </p>
          <Link href="/commissions" className="btn btn-light">
            Start a commission <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
