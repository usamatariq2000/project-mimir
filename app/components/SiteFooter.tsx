import Link from "next/link";

/* Colophon: the ledger's closing entry. */
export default function SiteFooter() {
  return (
    <footer className="rule-t xl:pl-14">
      <div className="grid gap-0 sm:grid-cols-3">
        <div className="rule-b px-6 py-10 sm:border-b-0 sm:border-r sm:border-rule">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-3 w-3 bg-acid" />
            <span className="display text-base">MIMIR</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
            The execution layer between AI and your systems. Every capability a
            tool. Every action logged.
          </p>
        </div>
        <div className="rule-b px-6 py-10 sm:border-b-0 sm:border-r sm:border-rule">
          <p className="engrave mb-4">Index</p>
          <ul className="space-y-2 font-mono text-xs uppercase tracking-wider text-ash">
            <li><Link className="transition-colors hover:text-acid" href="/platform">Platform</Link></li>
            <li><Link className="transition-colors hover:text-acid" href="/security">Security</Link></li>
            <li><Link className="transition-colors hover:text-acid" href="/app">Live deck</Link></li>
            <li><Link className="transition-colors hover:text-acid" href="/login">Log in</Link></li>
            <li><Link className="transition-colors hover:text-acid" href="/signup">Request access</Link></li>
          </ul>
        </div>
        <div className="flex flex-col justify-between px-6 py-10">
          <p className="engrave">Colophon</p>
          <p className="mt-4 font-mono text-[0.7rem] leading-6 text-dust">
            SET IN ARCHIVO & GEIST MONO
            <br />
            © 2026 MIMIR — WORKING NAME
            <br />
            LEDGER V3 · ALL ACTIONS LOGGED
          </p>
        </div>
      </div>
    </footer>
  );
}
