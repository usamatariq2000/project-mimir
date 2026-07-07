"use client";

import { useRef, type ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, useGSAP);

/* Decrypt-style reveal. The chars set is drawn from the ledger's own
   vocabulary — digits, slashes, brackets — not random matrix noise. */
export default function Scramble({
  text,
  as: Tag = "span",
  className,
  duration = 1.1,
  delay = 0,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    gsap.to(ref.current, {
      scrambleText: {
        text,
        chars: "01/[]{}<>_—",
        speed: 0.4,
      },
      duration,
      delay,
      ease: "none",
      scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
    });
  }, [text]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
