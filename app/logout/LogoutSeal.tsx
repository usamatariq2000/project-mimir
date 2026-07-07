"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* Logging out closes the ledger: open records file, couplings release, the
   tape seals, and the session stamp lands. Then back to the login handshake. */

const STEPS = [
  "filing open records",
  "releasing system couplings",
  "sealing audit tape",
  "locking the vault",
];

export default function LogoutSeal() {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // next login should re-run the preflight
    sessionStorage.removeItem("mimir.booted");
  }, []);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>("[data-out]");
      const tl = gsap.timeline({
        onComplete: () => setTimeout(() => router.push("/login"), 900),
      });
      rows.forEach((row) => {
        tl.to(row, { opacity: 1, duration: 0.12 })
          .to(row.querySelector("[data-ok]"), { opacity: 1, duration: 0.1 }, "+=0.3");
      });
      tl.fromTo(
        "[data-seal]",
        { opacity: 0, scale: 2.6, rotate: -14 },
        { opacity: 1, scale: 1, rotate: -6, duration: 0.4, ease: "power4.in" }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className="grid min-h-screen place-items-center bg-carbon px-6">
      <div className="w-full max-w-md">
        <p className="engrave">Session #143 · closing</p>
        <div className="mt-6 space-y-2.5 font-mono text-xs">
          {STEPS.map((s) => (
            <div key={s} data-out className="flex items-baseline justify-between opacity-0">
              <span className="text-ash">{s}</span>
              <span data-ok className="text-acid opacity-0">✓ done</span>
            </div>
          ))}
        </div>
        <div className="relative mt-10 border-t border-rule pt-6">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-dust">
            Operator u.tariq · off the deck — routing to the handshake…
          </p>
          <div
            data-seal
            className="pointer-events-none absolute -top-4 right-0 border-4 border-bone px-4 py-1.5 font-mono text-base font-bold uppercase tracking-[0.2em] text-bone opacity-0"
          >
            Session sealed
          </div>
        </div>
      </div>
    </div>
  );
}
