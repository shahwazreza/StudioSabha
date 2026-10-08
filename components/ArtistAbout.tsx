import Link from "next/link";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";
import { AboutContent, Exhibition, paragraphs } from "@/lib/about";
import { ArrowRight, Instagram } from "@/components/icons";

function ExhibitionsTable({ exhibitions }: { exhibitions: Exhibition[] }) {
  if (!exhibitions.length) return null;
  return (
    <table className="table mt-3">
      <thead>
        <tr>
          <th>Exhibited</th>
          <th>Where</th>
          <th>Year</th>
        </tr>
      </thead>
      <tbody>
        {exhibitions.map((show) => (
          <tr key={`${show.name}-${show.years}`}>
            <td className="font-semibold">{show.name}</td>
            <td>{show.place}</td>
            <td className="whitespace-nowrap">{show.years}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Portrait (black and white, per the design system) beside her bio.
// `full` adds the rest of her story for the About page. All text and the
// portrait come from /admin/about.
export default function ArtistAbout({
  about,
  full = false,
  showWorkLink = false,
}: {
  about: AboutContent;
  full?: boolean;
  showWorkLink?: boolean; // only when there are portfolio pieces to link to
}) {
  const Heading = full ? "h1" : "h2";

  return (
    <section className={`grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] ${full ? "" : "border-t-2 border-rule"}`}>
      <div
        className={`aspect-square self-start bg-cover md:sticky md:top-0 md:aspect-[4/5] ${about.portrait_grayscale ? "grayscale-photo" : ""}`}
        style={{
          backgroundImage: `url("${about.portrait_url}")`,
          backgroundPosition: "center 15%",
        }}
        role="img"
        data-protect
        aria-label={`Portrait of ${about.name}`}
      />
      <div className="flex min-w-0 flex-col gap-5 px-5 py-8 md:border-l-2 md:border-rule md:px-10 md:py-12">
        <div className="kicker">About the artist</div>
        <Heading className="m-0 text-[40px] leading-[0.95] tracking-[-0.04em] md:text-[64px]">
          {about.name}
        </Heading>
        <p className="m-0 max-w-[560px] text-[17px] leading-[1.4] md:text-[22px] md:leading-[1.35]">
          {about.intro}
        </p>

        {full ? (
          <div className="max-w-[560px] space-y-4 opacity-80">
            {paragraphs(about.story).map((text, i) => (
              <p key={i} className="m-0 whitespace-pre-line">
                {text}
              </p>
            ))}
          </div>
        ) : (
          <p className="m-0 max-w-[520px] whitespace-pre-line opacity-75">{about.summary}</p>
        )}

        <div className={full ? "" : "hidden md:block"}>
          <ExhibitionsTable exhibitions={about.exhibitions} />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {!full && (
            <Link href="/about" className="btn-ghost">
              Read her story <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {showWorkLink && (
            <Link href={full ? "#work" : "/about#work"} className="btn-ghost">
              See her portfolio <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="StudioSabha on Instagram"
            className="inline-flex items-center gap-2 text-sm text-ink no-underline hover:text-accent"
          >
            <Instagram /> @{INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
    </section>
  );
}
