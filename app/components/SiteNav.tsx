"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/platform", label: "Platform" },
  { href: "/security", label: "Security" },
];

/* Flat ledger header: a ruled bar, mono nav, one acid action. */
export default function SiteNav() {
  const pathname = usePathname();

  return (
    <header data-gauge-offset className="sticky top-0 z-50 border-b border-rule bg-carbon/95 backdrop-blur-sm">
      <nav className="flex items-stretch justify-between xl:pl-14">
        <Link href="/" className="flex items-center gap-3 px-6 py-4">
          <span aria-hidden className="h-3 w-3 bg-acid" />
          <span className="display text-base tracking-wide">MIMIR</span>
        </Link>

        <div className="flex items-stretch">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`hidden items-center border-l border-rule px-5 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-colors sm:flex ${
                pathname === l.href ? "bg-soot text-bone" : "text-ash hover:bg-soot hover:text-bone"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="flex items-center border-l border-rule px-5 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ash transition-colors hover:bg-soot hover:text-bone"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="flex items-center bg-acid px-6 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-carbon transition-colors hover:bg-[#d7ff2e]"
          >
            Request access
          </Link>
        </div>
      </nav>
    </header>
  );
}
