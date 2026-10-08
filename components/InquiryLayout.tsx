import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

// Describes how a commission works on this site. Keep it to what the site
// actually does; Sabha should confirm anything more specific before it goes here.
const STEPS = [
  { n: "01", title: "Share your idea", detail: "Subject, rough size and any reference photos." },
  { n: "02", title: "Hear back from Sabha", detail: "She replies by email to talk through details and price." },
  { n: "03", title: "Painted for you", detail: "Your piece is made to order." },
];

// Red poster on the left, form on the right (stacked on phones).
export default function InquiryLayout({
  mode,
  children,
}: {
  mode: "commission" | "contact";
  children: React.ReactNode;
}) {
  const isCommission = mode === "commission";

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-between gap-5 bg-accent px-5 pb-5 pt-7 text-paper md:gap-12 md:px-10 md:py-12">
        <div>
          <div className="mb-3 text-[11px] uppercase tracking-kicker md:mb-4 md:text-xs">
            {isCommission ? "Commissions welcome" : "Contact"}
          </div>
          <h1 className="m-0 text-[clamp(40px,12vw,56px)] leading-[0.86] tracking-[-0.05em] text-paper md:text-[clamp(40px,5.2vw,72px)]">
            {isCommission ? "Commission a piece." : "Get in touch."}
          </h1>
        </div>

        {isCommission ? (
          <div className="grid grid-cols-1 border-t-2 border-paper/60 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="grid grid-cols-[44px_1fr] border-b border-paper/50 py-2.5 text-sm md:block md:border-b-0 md:pb-0 md:pr-4 md:pt-4"
              >
                <div className="font-extrabold md:text-[40px] md:leading-none md:tracking-[-0.04em]">{step.n}</div>
                <div>
                  <span className="font-extrabold md:mt-2.5 md:block md:text-base">{step.title}</span>{" "}
                  <span className="md:mt-1 md:block md:text-[13px]">{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-t-2 border-paper/60 pt-4 text-base">
            <p className="m-0 max-w-[420px]">
              Questions about a painting, availability or anything else. Sabha
              replies by email.
            </p>
            <p className="m-0 mt-3">
              Instagram:{" "}
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-extrabold text-paper">
                @{INSTAGRAM_HANDLE}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="px-5 pb-7 pt-6 md:px-10 md:py-12">{children}</div>
    </div>
  );
}
