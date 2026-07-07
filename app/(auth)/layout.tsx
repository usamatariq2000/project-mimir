import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-lg border border-hairline bg-gradient-to-b from-white to-fog shadow-sm"
          >
            <span className="h-2.5 w-2.5 rotate-45 rounded-[3px] bg-gradient-to-br from-bronze to-bronze-deep" />
          </span>
          <span className="display text-lg tracking-tight">Mimir</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        {children}
      </main>
    </div>
  );
}
