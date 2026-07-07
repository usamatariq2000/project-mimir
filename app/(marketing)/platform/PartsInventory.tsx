"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NumberTicker } from "@/components/ui/number-ticker";
import Scramble from "../../components/Scramble";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* The eight machined parts, as a living inventory: rows slide in from
   alternating sides and their gauges fill as you pass them. */

const PARTS = [
  { n: "7.1", title: "Integration Layer", body: "Couples to REST APIs, webhooks, databases. Discovery, auth, execution.", load: 92 },
  { n: "7.2", title: "Tool Generator", body: "Machines endpoints into typed, permissioned tools with execution rules.", load: 87 },
  { n: "7.3", title: "Tool Registry", body: "Central store of everything the agent can do — definitions, logs, metadata.", load: 64 },
  { n: "7.4", title: "Auth Manager", body: "Keys, JWT, OAuth2 — sealed, refreshed, never shown to the model.", load: 71 },
  { n: "7.5", title: "Agent Runtime", body: "Reads intent, selects tools, reasons through multi-step workflows.", load: 96 },
  { n: "7.6", title: "Execution Engine", body: "Runs calls with retries, rate limits, normalization, error handling.", load: 89 },
  { n: "7.7", title: "Knowledge Layer", body: "System context and business-logic maps grounding every decision.", load: 58 },
  { n: "7.8", title: "Audit System", body: "The full causal chain of every execution, engraved immutably.", load: 100 },
];

export default function PartsInventory() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-part-row]").forEach((row, i) => {
        gsap.from(row, {
          x: i % 2 ? 60 : -60,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 88%", once: true },
        });
        const bar = row.querySelector("[data-gauge]");
        if (bar)
          gsap.from(bar, {
            scaleX: 0,
            transformOrigin: "left",
            duration: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 80%", once: true },
          });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="rule-b">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 002 / Component inventory
      </div>
      <div className="px-6 py-14 xl:pl-20">
        <Scramble as="h2" className="display block text-4xl sm:text-6xl" text="Eight machined parts." />
        <div className="rule-t mt-12">
          {PARTS.map((p) => (
            <div
              key={p.n}
              data-part-row
              className="group rule-b grid grid-cols-[3.5rem_1fr] items-center gap-4 px-2 py-5 transition-colors hover:bg-soot sm:grid-cols-[4rem_16rem_1fr_8rem]"
            >
              <span className="font-mono text-xs text-dust transition-colors group-hover:text-acid">{p.n}</span>
              <h3 className="display text-lg sm:text-xl">{p.title}</h3>
              <p className="col-span-2 max-w-lg text-sm leading-relaxed text-ash sm:col-span-1">{p.body}</p>
              <div className="hidden sm:block">
                <p className="text-right font-mono text-[0.6rem] text-dust">
                  duty <NumberTicker value={p.load} className="text-ash" />%
                </p>
                <div className="mt-1 h-1 w-full bg-soot-2">
                  <div data-gauge className="h-full bg-acid" style={{ width: `${p.load}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
