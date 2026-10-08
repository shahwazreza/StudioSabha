"use client";

import { useEffect, useState } from "react";

// Uses the visitor's own clock, so "Good morning" matches where she is.
export default function Greeting() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const hour = now?.getHours() ?? 12;
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <div>
      <div className="mb-1.5 hidden h-5 text-[13px] opacity-65 md:block">
        {now?.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
      </div>
      <h1 className="m-0 text-[34px] leading-[0.95] tracking-[-0.04em] md:text-[56px]">
        {now ? `Good ${part}, Sabha.` : "Hello, Sabha."}
      </h1>
    </div>
  );
}
