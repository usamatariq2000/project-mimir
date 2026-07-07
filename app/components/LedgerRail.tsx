"use client";

import { useEffect, useState } from "react";

/* Fixed index rail — the ledger's spine. Section numbers + a live UTC clock.
   Starts below the sticky header, and the number of the section currently
   in view burns acid. */
const SECTIONS = [
  { id: "difference", n: "001" },
  { id: "conversion", n: "002" },
  { id: "execution", n: "003" },
  { id: "safeguards", n: "004" },
  { id: "applications", n: "005" },
  { id: "access", n: "006" },
];

export default function LedgerRail() {
  const [utc, setUtc] = useState("--:--:--");
  const [top, setTop] = useState(0);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setUtc(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // sit below the sticky header
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-gauge-offset]");
      setTop(el ? el.getBoundingClientRect().height : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // scroll spy: the section whose top has crossed 40% of the viewport wins
  useEffect(() => {
    let raf = 0;
    const spy = () => {
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActive(current);
      raf = requestAnimationFrame(spy);
    };
    raf = requestAnimationFrame(spy);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <aside
      style={{ top, height: `calc(100vh - ${top}px)` }}
      className="fixed left-0 z-40 hidden w-14 flex-col items-center justify-between border-r border-rule bg-carbon py-6 xl:flex"
    >
      <span className="font-mono text-[0.6rem] tracking-[0.2em] text-dust [writing-mode:vertical-lr]">
        MIMIR — OPERATIONS LEDGER
      </span>
      <nav className="flex flex-col items-center gap-4">
        {SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={on ? "true" : undefined}
              className={`relative font-mono text-[0.6rem] transition-colors duration-300 ${
                on ? "text-acid" : "text-dust hover:text-acid"
              }`}
            >
              {on && (
                <span
                  aria-hidden
                  className="absolute -left-2.5 top-1/2 h-1 w-1 -translate-y-1/2 bg-acid shadow-[0_0_6px_rgba(200,243,29,0.9)]"
                />
              )}
              {s.n}
            </a>
          );
        })}
      </nav>
      <span className="font-mono text-[0.6rem] tracking-widest text-ash [writing-mode:vertical-lr]" suppressHydrationWarning>
        {utc}
      </span>
    </aside>
  );
}
