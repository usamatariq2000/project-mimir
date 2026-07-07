import type { Metadata } from "next";
import Link from "next/link";
import Scramble from "../../components/Scramble";
import Reveal from "../../components/Reveal";
import TapeDivider from "../sections/TapeDivider";
import RedactionScene from "./RedactionScene";
import AuditFeed from "./AuditFeed";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Mimir's security model: credential isolation, permission-scoped tools, approval gates, and an immutable audit trail.",
};

const CLAUSES = [
  { n: "2.1", title: "Credential isolation", body: "Capability, never keys. A leaked prompt cannot leak a secret." },
  { n: "2.2", title: "Permission-scoped tools", body: "Each tool carries its boundary. The agent physically lacks the surface to overreach." },
  { n: "2.3", title: "Approval gates", body: "Refunds, deletions, sends — held for a human yes. The yes is logged too." },
  { n: "2.4", title: "Immutable audit", body: "Prompt, tool, call, response, timestamp. The full causal chain, always." },
  { n: "2.5", title: "Encryption throughout", body: "At rest, in transit, tenant-isolated. No client bleeds into another." },
];

export default function SecurityPage() {
  return (
    <div>
      {/* Header entry */}
      <section className="rule-b">
        <div className="rule-b flex flex-wrap items-center justify-between gap-3 px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
          <span>Entry 000 / Safeguards</span>
          <span>DOC. MMR-SEC-01</span>
        </div>
        <div className="px-6 pb-16 pt-14 xl:pl-20">
          <Scramble
            as="h1"
            className="display block max-w-4xl text-5xl sm:text-7xl"
            text="Able to act. Unable to overreach."
          />
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ash">
            Giving AI real execution only works if the boundaries are mechanical,
            not behavioral. Mimir enforces them in the runtime — not in the prompt.
          </p>
        </div>
      </section>

      <TapeDivider />
      <RedactionScene />

      {/* Clauses + live audit feed */}
      <section className="rule-b">
        <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
          Entry 002 / The clauses · Entry 003 / The record
        </div>
        <div className="grid lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="lg:border-r lg:border-rule">
            <ul>
              {CLAUSES.map((c) => (
                <li key={c.n} data-reveal className="group rule-b flex gap-6 px-6 py-6 transition-colors hover:bg-soot xl:pl-20">
                  <span className="font-mono text-xs text-acid">{c.n}</span>
                  <div>
                    <h2 className="font-mono text-sm uppercase tracking-wider text-bone group-hover:text-acid">
                      {c.title}
                    </h2>
                    <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ash">{c.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="hidden max-h-[28rem] bg-soot px-6 py-4 lg:block">
            <p className="engrave mb-2">Live audit tape</p>
            <AuditFeed />
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="px-6 py-16 text-center xl:pl-20">
        <p className="engrave">The short version</p>
        <Scramble
          as="p"
          className="display mx-auto mt-5 block max-w-2xl text-3xl sm:text-4xl"
          text="It can do exactly what you allow. You can see everything it did."
        />
        <Link href="/signup" className="btn-primary mt-9">
          Request access
        </Link>
      </section>
    </div>
  );
}
