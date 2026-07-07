"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* Dynamic cursor: an acid dot that snaps to the pointer and a bone ring that
   glides after it (GSAP quickTo). The ring flares over anything interactive
   and collapses while pressing. Pointer-fine devices only.
   The elements are always rendered (hidden) so refs exist before GSAP wires
   them — enabling in the same effect as setup left quickTo bound to null. */
export default function SmoothCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced || !dot.current || !ring.current) return;

    document.documentElement.classList.add("custom-cursor");

    const dotX = gsap.quickTo(dot.current, "x", { duration: 0.08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot.current, "y", { duration: 0.08, ease: "power2.out" });
    const ringX = gsap.quickTo(ring.current, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring.current, "y", { duration: 0.45, ease: "power3.out" });

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        // jump to the pointer before revealing so it doesn't fly in from 0,0
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to(dot.current, { opacity: 1, duration: 0.2 });
        gsap.to(ring.current, { opacity: 0.55, duration: 0.2 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const INTERACTIVE = "a, button, input, textarea, select, [role='button'], .react-flow__node";
    const over = (e: PointerEvent) => {
      const hit = (e.target as Element | null)?.closest?.(INTERACTIVE);
      gsap.to(ring.current, { scale: hit ? 2.1 : 1, duration: 0.25 });
      gsap.to(dot.current, { scale: hit ? 0.5 : 1, duration: 0.25 });
    };
    const down = () => gsap.to(ring.current, { scale: 0.7, duration: 0.15 });
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.25 });
    const leave = () => {
      shown = false;
      gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 });
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[2000000000] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-acid opacity-0"
      />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[2000000000] h-8 w-8 -translate-x-1/2 -translate-y-1/2 border border-bone opacity-0 mix-blend-difference"
      />
    </>
  );
}
