"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BOOT_CHECKS } from "../lib/mock-data";

gsap.registerPlugin(useGSAP);

/* Preflight: every login boots the deck like an instrument powering on —
   each subsystem pings and reports before the controls unlock. Runs once
   per browser session. */
export default function BootCheck({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [skip, setSkip] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("mimir.booted")) {
      onDone();
      return;
    }
    setSkip(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(
    () => {
      if (skip) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-check]");
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("mimir.booted", "1");
          gsap.to(root.current, {
            autoAlpha: 0,
            duration: 0.4,
            delay: 0.5,
            onComplete: onDone,
          });
        },
      });
      rows.forEach((row) => {
        const ok = row.querySelector("[data-ok]");
        tl.to(row, { opacity: 1, duration: 0.12 })
          .to(ok, { opacity: 1, duration: 0.1 }, "+=0.28");
      });
      tl.to("[data-verdict]", { opacity: 1, duration: 0.3 }, "+=0.2");
    },
    { scope: root, dependencies: [skip] }
  );

  if (skip) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[150] grid place-items-center bg-carbon"
      role="status"
      aria-label="System preflight check"
    >
      <div className="w-full max-w-md px-6">
        <p className="engrave">Preflight · deck boot sequence</p>
        <div className="mt-6 space-y-2.5 font-mono text-xs">
          {BOOT_CHECKS.map((c) => (
            <div key={c} data-check className="flex items-baseline justify-between opacity-0">
              <span className="text-ash">{c}</span>
              <span data-ok className="text-acid opacity-0">✓ ok</span>
            </div>
          ))}
        </div>
        <p data-verdict className="mt-6 border-l-2 border-acid pl-4 font-mono text-xs uppercase tracking-wider text-bone opacity-0">
          All systems nominal — deck unlocked
        </p>
      </div>
    </div>
  );
}
