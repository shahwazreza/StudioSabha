import Link from "next/link";
import { INSTAGRAM_URL } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t-2 border-rule">
      <div className="mx-auto flex max-w-page flex-col gap-2 px-5 py-5 text-[13px] md:flex-row md:items-center md:justify-between md:px-10">
        <span className="font-extrabold">STUDIOSABHA</span>
        <span className="opacity-65">
          &copy; {new Date().getFullYear()} Sabha Sumaiya &middot; Payments by Square
        </span>
        <span>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-ink no-underline hover:text-accent">
            Instagram
          </a>{" "}
          &middot;{" "}
          <Link href="/contact" className="text-ink no-underline hover:text-accent">
            Contact
          </Link>
        </span>
      </div>
      <p className="mx-auto m-0 max-w-page px-5 pb-5 text-xs opacity-55 md:px-10">
        All artwork and images &copy; Sabha Sumaiya. They may not be copied, printed, or reproduced
        in any form without written permission.
      </p>
    </footer>
  );
}
