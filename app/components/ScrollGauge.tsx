"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import type Lenis from "lenis";

/* The scroll gauge: replaces the native scrollbar with a machinist's rule on
   the right edge. An acid needle rides the rail with a live percent readout,
   its trail stretching with scroll velocity; click or drag the rail to scrub
   the page (routed through Lenis so it stays buttery). Desktop pointers only. */

export default function ScrollGauge() {
  const rail = useRef<HTMLDivElement>(null);
  const needle = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [topOffset, setTopOffset] = useState(0);
  const pathname = usePathname();
  // the deck is an app view with its own internal scroll — it gets its own meter
  const suppressed = pathname.startsWith("/app");

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setEnabled(true);
  }, []);

  // start the rail below a sticky header when one declares itself
  useEffect(() => {
    if (!enabled || suppressed) return;
    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-gauge-offset]");
      setTopOffset(el ? el.getBoundingClientRect().height : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled, suppressed, pathname]);

  useEffect(() => {
    if (!enabled || suppressed || !rail.current || !needle.current) return;
    document.documentElement.classList.add("gauge-scroll");

    const needleY = gsap.quickTo(needle.current, "y", { duration: 0.3, ease: "power2.out" });
    let lastP = 0;
    let raf = 0;

    const tick = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const h = rail.current!.clientHeight - 28;
      needleY(p * h);
      // velocity → the trail stretches behind the needle
      const v = Math.min(Math.abs(p - lastP) * 60, 1);
      if (trail.current) {
        gsap.set(trail.current, {
          scaleY: 1 + v * 26,
          opacity: 0.25 + v * 0.6,
          transformOrigin: p >= lastP ? "top" : "bottom",
        });
      }
      if (readout.current) {
        readout.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      }
      lastP = p;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // click / drag to scrub
    let dragging = false;
    const scrubTo = (clientY: number) => {
      const r = rail.current!.getBoundingClientRect();
      const p = gsap.utils.clamp(0, 1, (clientY - r.top) / r.height);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      if (lenis) lenis.scrollTo(p * max, { duration: dragging ? 0.15 : 0.9 });
      else window.scrollTo({ top: p * max });
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      rail.current!.setPointerCapture(e.pointerId);
      scrubTo(e.clientY);
    };
    const move = (e: PointerEvent) => dragging && scrubTo(e.clientY);
    const up = () => (dragging = false);

    const el = rail.current;
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);

    return () => {
      document.documentElement.classList.remove("gauge-scroll");
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
  }, [enabled, suppressed]);

  if (!enabled || suppressed) return null;

  return (
    <div
      ref={rail}
      aria-hidden
      style={{ top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
      className="group fixed right-0 z-[190] hidden w-7 cursor-pointer select-none border-l border-rule bg-carbon/80 backdrop-blur-sm transition-[width] duration-200 hover:w-9 lg:block"
    >
      {/* machinist ticks */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, var(--rule) 0px, var(--rule) 1px, transparent 1px, transparent 12px)," +
            "repeating-linear-gradient(180deg, rgba(232,228,216,0.28) 0px, rgba(232,228,216,0.28) 1px, transparent 1px, transparent 60px)",
          backgroundSize: "8px 100%, 14px 100%",
          backgroundRepeat: "repeat-y",
          backgroundPosition: "right, right",
        }}
      />
      {/* endpoints */}
      <span className="absolute left-1 top-1.5 font-mono text-[0.5rem] text-dust">000</span>
      <span className="absolute bottom-1.5 left-1 font-mono text-[0.5rem] text-dust">100</span>

      {/* needle + trail + readout */}
      <div ref={needle} className="absolute left-0 top-0 w-full">
        <div ref={trail} className="absolute left-0 h-7 w-full bg-acid/20" />
        <div className="relative flex items-center">
          <span className="h-px w-full bg-acid shadow-[0_0_6px_rgba(200,243,29,0.8)]" />
          <span className="absolute -left-0.5 h-2 w-2 -translate-x-full bg-acid [clip-path:polygon(0_50%,100%_0,100%_100%)]" />
        </div>
        <span
          ref={readout}
          className="absolute right-1 top-1.5 font-mono text-[0.55rem] tracking-wider text-acid opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          000
        </span>
      </div>
    </div>
  );
}
