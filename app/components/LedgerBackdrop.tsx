"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* The page sits on ruled ledger paper: faint column rules, a margin line,
   and a slow acid scan-line that drifts with scroll. Fixed, subtle, cheap. */
export default function LedgerBackdrop() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Scan-line drifts down as the document scrolls; parallax on the rules.
      gsap.to("[data-scan]", {
        top: "100%",
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 1.2 },
      });
      gsap.to("[data-rules]", {
        backgroundPosition: "0px 240px",
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "max", scrub: 2 },
      });
    },
    { scope: root }
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* vertical column rules */}
      <div
        data-rules
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(232,228,216,0.035) 0px, rgba(232,228,216,0.035) 1px, transparent 1px, transparent 120px)," +
            "repeating-linear-gradient(0deg, rgba(232,228,216,0.02) 0px, rgba(232,228,216,0.02) 1px, transparent 1px, transparent 120px)",
        }}
      />
      {/* red margin line, like a physical ledger */}
      <div className="absolute inset-y-0 left-[7.5rem] hidden w-px bg-ember/15 xl:block" />
      {/* drifting scan-line */}
      <div
        data-scan
        className="absolute left-0 top-[-5%] h-px w-full bg-gradient-to-r from-transparent via-acid/25 to-transparent"
      />
      {/* corner registration marks */}
      <span className="absolute left-4 top-20 font-mono text-[0.55rem] text-dust/60">+</span>
      <span className="absolute right-4 top-20 font-mono text-[0.55rem] text-dust/60">+</span>
      <span className="absolute bottom-6 left-4 font-mono text-[0.55rem] text-dust/60">+</span>
      <span className="absolute bottom-6 right-4 font-mono text-[0.55rem] text-dust/60">+</span>
    </div>
  );
}
