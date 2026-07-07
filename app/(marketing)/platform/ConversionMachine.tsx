"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* Pinned, scrubbed: a raw endpoint rides the conveyor through four stations
   and rolls off the line as a finished tool. Scroll runs the machine. */

const STATIONS = [
  { n: "ST.1", name: "Discover", out: "endpoint mapped" },
  { n: "ST.2", name: "Type", out: "schema attached" },
  { n: "ST.3", name: "Permit", out: "boundary welded" },
  { n: "ST.4", name: "Arm", out: "tool ready" },
];

export default function ConversionMachine() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=2600",
            pin: true,
            scrub: 0.7,
          },
        });

        // conveyor: chip travels station to station
        tl.to("[data-chip]", { left: "3%", duration: 0.4 }, 0);
        STATIONS.forEach((_, i) => {
          const pos = 3 + ((i + 1) * 88) / STATIONS.length;
          tl.to("[data-chip]", { left: `${pos}%`, duration: 1, ease: "none" }, i + 0.4)
            .to(`[data-station="${i}"]`, { borderColor: "var(--acid)", duration: 0.15 }, i + 1.15)
            .fromTo(`[data-flash="${i}"]`, { opacity: 0 }, { opacity: 1, duration: 0.12, yoyo: true, repeat: 1 }, i + 1.2)
            .to(`[data-stamp="${i}"]`, { opacity: 1, y: 0, duration: 0.25 }, i + 1.25)
            .to(`[data-station="${i}"]`, { borderColor: "var(--rule)", duration: 0.3 }, i + 1.8);
        });
        // chip label evolves
        tl.set("[data-chip-label]", { textContent: "GET /v1/payments" }, 0)
          .set("[data-chip-label]", { textContent: "payments: mapped" }, 1.3)
          .set("[data-chip-label]", { textContent: "get_payments(schema)" }, 2.3)
          .set("[data-chip-label]", { textContent: "get_payments [auto]" }, 3.3)
          .set("[data-chip-label]", { textContent: "✓ get_payments()" }, 4.3)
          .to("[data-chip]", { borderColor: "var(--acid)", color: "var(--acid)", duration: 0.2 }, 4.3);
      });

      /* Reduced motion on desktop: show the line's finished state. */
      mm.add("(prefers-reduced-motion: reduce) and (min-width: 1024px)", () => {
        gsap.set("[data-stamp]", { opacity: 1, y: 0 });
        gsap.set("[data-chip]", {
          left: "80%",
          borderColor: "var(--acid)",
          color: "var(--acid)",
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="rule-b lg:min-h-screen">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 001 / The conversion machine — scroll to run the line
      </div>

      <div className="px-6 py-14 xl:pl-20">
        <h2 className="display text-4xl sm:text-6xl">
          The line that turns
          <br />
          endpoints into <span className="text-acid">operators</span>.
        </h2>

        {/* Conveyor (desktop: animated; mobile: static list) */}
        <div className="relative mt-16 hidden lg:block">
          {/* track */}
          <div className="rule-t rule-b relative h-40">
            <div className="absolute inset-x-0 top-1/2 h-px bg-rule" aria-hidden />
            {/* traveling chip */}
            <div
              data-chip
              className="absolute left-[-20%] top-1/2 z-10 -translate-y-1/2 border border-bone bg-carbon px-4 py-2.5 font-mono text-xs text-bone shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]"
            >
              <span data-chip-label>GET /v1/payments</span>
            </div>
            {/* stations */}
            <div className="absolute inset-0 grid grid-cols-4">
              {STATIONS.map((s, i) => (
                <div key={s.n} className="relative border-l border-rule last:border-r">
                  <div
                    data-station={i}
                    className="absolute left-1/2 top-1/2 h-24 w-36 -translate-x-1/2 -translate-y-1/2 border border-rule bg-soot"
                  >
                    <div data-flash={i} className="absolute inset-0 bg-acid/15 opacity-0" aria-hidden />
                    <p className="px-3 pt-2.5 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-dust">
                      {s.n}
                    </p>
                    <p className="display px-3 pt-1 text-lg">{s.name}</p>
                    <p
                      data-stamp={i}
                      className="translate-y-1 px-3 pt-1 font-mono text-[0.62rem] uppercase tracking-wider text-acid opacity-0"
                    >
                      ✓ {s.out}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-dust">
            One endpoint shown · Mimir runs every endpoint of every coupled system through this line
          </p>
        </div>

        {/* Mobile fallback */}
        <ol className="mt-12 space-y-3 lg:hidden">
          {STATIONS.map((s) => (
            <li key={s.n} className="plate flex items-baseline gap-4 p-4">
              <span className="font-mono text-[0.65rem] text-dust">{s.n}</span>
              <div>
                <p className="display text-lg">{s.name}</p>
                <p className="font-mono text-[0.65rem] uppercase tracking-wider text-acid">✓ {s.out}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
