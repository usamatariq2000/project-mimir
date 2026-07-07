"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";
import { DEMO_EXECUTION } from "../../lib/mock-data";

gsap.registerPlugin(ScrollTrigger, TextPlugin, useGSAP);

/* Entry 002. A live session record: the intent types itself, executions
   print underneath like a receipt. Plays once on scroll. */
export default function ExecutionDemo() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
      gsap.set(steps, { autoAlpha: 0 });
      gsap.set("[data-summary]", { autoAlpha: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
      });

      tl.to("[data-intent]", { text: DEMO_EXECUTION.intent, duration: 1.6, ease: "none" })
        .to(steps, { autoAlpha: 1, duration: 0.3, stagger: 0.5 }, "+=0.3")
        .to("[data-summary]", { autoAlpha: 1, duration: 0.5 }, "+=0.2");
    },
    { scope: root }
  );

  return (
    <section id="execution" ref={root} className="rule-b scroll-mt-14">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 003 / Execution record
      </div>
      <div className="grid lg:grid-cols-[1fr_1.5fr]">
        <div className="rule-b px-6 py-14 lg:border-b-0 lg:border-r lg:border-rule xl:pl-20">
          <h2 className="display text-4xl sm:text-5xl">
            Say it once.
            <br />
            <span className="text-acid">Watch it happen.</span>
          </h2>
          <p className="mt-5 max-w-sm text-ash">
            One sentence in. A multi-step operation out — selected, sequenced,
            executed, and printed to the record below.
          </p>
        </div>

        <div className="bg-soot px-6 py-10 font-mono text-xs sm:text-sm xl:pr-14">
          <p className="text-dust">SESSION #142 · OPERATOR u.tariq · LIVE</p>
          <p className="mt-5 text-bone">
            <span className="text-acid">❯ </span>
            <span data-intent />
            <span className="animate-pulse text-dust">█</span>
          </p>
          <div className="mt-6">
            {DEMO_EXECUTION.steps.map((s, i) => (
              <div key={s.tool + s.detail} data-step className="rule-b grid grid-cols-[2.5rem_1fr] gap-2 py-3 text-[0.75rem] first:border-t first:border-rule sm:grid-cols-[3rem_11rem_1fr_auto]">
                <span className="text-dust">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-bone">{s.tool}()</span>
                <span className="text-ash">{s.detail}</span>
                <span className="text-acid">✓ {s.durationMs}ms</span>
              </div>
            ))}
          </div>
          <p data-summary className="mt-6 border-l-2 border-acid pl-4 text-[0.8rem] leading-relaxed text-ash">
            {DEMO_EXECUTION.summary}
          </p>
        </div>
      </div>
    </section>
  );
}
