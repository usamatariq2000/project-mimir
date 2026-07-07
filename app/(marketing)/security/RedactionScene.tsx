"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* Pinned, scrubbed: a live credential gets physically redacted block by
   block as you scroll, until only capability remains. Then the approval
   stamp slams onto the record. The security model, played, not told. */

const KEY_CHARS = "sk_live_4f8aa1b2c9d0e3f4a5b6".split("");

export default function RedactionScene() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=2200",
            pin: true,
            scrub: 0.6,
          },
        });

        // 1 — redact the key, char by char
        tl.to("[data-kchar]", {
          color: "transparent",
          backgroundColor: "var(--bone)",
          duration: 0.04,
          stagger: { each: 0.05, from: "random" },
        });
        // 2 — the sealed notice + capability line
        tl.to("[data-sealed]", { opacity: 1, y: 0, duration: 0.4 }, ">-0.1")
          .to("[data-capability]", { opacity: 1, y: 0, duration: 0.5 }, ">0.1");
        // 3 — the approval stamp slams in
        tl.fromTo(
          "[data-approve]",
          { opacity: 0, scale: 3.2, rotate: -18 },
          { opacity: 1, scale: 1, rotate: -8, duration: 0.5, ease: "power4.in" },
          ">0.3"
        ).fromTo(
          "[data-shake]",
          { x: 0 },
          { x: 3, duration: 0.05, yoyo: true, repeat: 3 },
          ">-0.05"
        );
      });

      /* Mobile: no pin — the same sequence auto-plays once when the section
         enters view, condensed to a few seconds. */
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 767px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });
        tl.to("[data-kchar]", {
          color: "transparent",
          backgroundColor: "var(--bone)",
          duration: 0.03,
          stagger: { each: 0.03, from: "random" },
        })
          .to("[data-sealed]", { opacity: 1, y: 0, duration: 0.4 }, ">-0.1")
          .to("[data-capability]", { opacity: 1, y: 0, duration: 0.5 }, ">0.1")
          .fromTo(
            "[data-approve]",
            { opacity: 0, scale: 2.4, rotate: -18 },
            { opacity: 1, scale: 1, rotate: -8, duration: 0.45, ease: "power4.in" },
            ">0.3"
          );
      });

      /* Reduced motion: skip the theater, show the outcome. */
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-kchar]", { color: "transparent", backgroundColor: "var(--bone)" });
        gsap.set(["[data-sealed]", "[data-capability]"], { opacity: 1, y: 0 });
        gsap.set("[data-approve]", { opacity: 1, scale: 1, rotate: -8 });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="rule-b md:min-h-screen">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 001 / Redaction — scroll to seal the key
      </div>

      <div data-shake className="px-6 py-16 xl:pl-20">
        <h2 className="display max-w-3xl text-4xl sm:text-6xl">
          The model never
          <br />
          sees the <span className="text-ember">key</span>.
        </h2>

        <div className="relative mt-14 max-w-3xl">
          <div className="plate-sunken p-6 sm:p-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-dust">
              stripe · production credential
            </p>
            <p className="mt-4 break-all font-mono text-xl leading-relaxed text-bone sm:text-3xl">
              {KEY_CHARS.map((c, i) => (
                <span key={i} data-kchar className="inline-block">
                  {c}
                </span>
              ))}
            </p>
            <p data-sealed className="mt-4 translate-y-2 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ash opacity-0">
              ✓ sealed into the vault — never enters a prompt, a log, or a model
            </p>
            <p data-capability className="mt-6 translate-y-2 font-mono text-lg text-acid opacity-0 sm:text-2xl">
              → refund_payment( <span className="text-dust">capability only</span> )
            </p>
          </div>

          {/* the stamp */}
          <div
            data-approve
            className="pointer-events-none absolute -right-4 -top-8 border-4 border-acid px-5 py-2 font-mono text-lg font-bold uppercase tracking-[0.2em] text-acid opacity-0 sm:-right-10"
          >
            Approved · u.tariq
          </div>
        </div>

        <p className="mt-10 max-w-md text-sm leading-relaxed text-ash">
          Sensitive actions pause here. A human stamps the record, the stamp
          itself is logged, and only then does the engine fire.
        </p>
      </div>
    </section>
  );
}
