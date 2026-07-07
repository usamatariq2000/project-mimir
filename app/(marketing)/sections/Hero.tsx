"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Scramble from "../../components/Scramble";

gsap.registerPlugin(useGSAP);

/* Entry 000. Type IS the hero: three stacked lines of display type revealed
   like a stamp press, with a live intent line typed underneath. */
export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-line]", {
        yPercent: 110,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.12,
        delay: 0.15,
      });
      gsap.from("[data-meta]", { opacity: 0, duration: 0.6, delay: 0.9, stagger: 0.08 });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="rule-b relative">
      {/* metadata strip */}
      <div className="rule-b flex flex-wrap items-center justify-between gap-3 px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        <span data-meta>Entry 000 / Statement</span>
        <span data-meta className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 animate-pulse bg-ember" aria-hidden />
          Private beta · accepting operators
        </span>
        <span data-meta className="hidden sm:inline">EST. 2026 · EXECUTION LAYER</span>
      </div>

      <div className="px-6 pb-16 pt-14 xl:pl-20">
        <h1 className="display text-[13.5vw] leading-[0.9] sm:text-[11vw] lg:text-[9vw]">
          <span className="block overflow-hidden">
            <span data-line className="block">Software,</span>
          </span>
          <span className="block overflow-hidden">
            <span data-line className="block">operated</span>
          </span>
          <span className="block overflow-hidden">
            <span data-line className="block">
              by <span className="text-acid">intent</span>
              <span className="text-ember">.</span>
            </span>
          </span>
        </h1>

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-md">
            <p data-meta className="text-base leading-relaxed text-ash">
              Most AI can only tell you what to do. Mimir plugs into the
              software you already run — payments, orders, support — and
              actually does it: you say what you want in plain language, it
              executes the steps in your systems, asks before anything
              sensitive, and shows you a record of every action.
            </p>
            <div data-meta className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="btn-primary">
                Request access
              </Link>
              <Link href="/app" className="btn-secondary">
                Watch it operate
              </Link>
            </div>
          </div>

          {/* live intent specimen */}
          <div data-meta className="plate-sunken w-full max-w-sm p-5 font-mono text-xs leading-7">
            <p className="text-dust">// state an intent</p>
            <p className="text-bone">
              ❯ <Scramble text="refund every failed payment from yesterday" duration={1.6} delay={1.2} />
            </p>
            <p className="text-dust">// mimir executes</p>
            <p className="text-acid">✓ 12 refunds · $1,847.20 · 4.1s · logged</p>
          </div>
        </div>
      </div>
    </section>
  );
}
