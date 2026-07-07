import type { Metadata } from "next";
import Link from "next/link";
import Scramble from "../../components/Scramble";
import Reveal from "../../components/Reveal";
import TapeDivider from "../sections/TapeDivider";
import ConversionMachine from "./ConversionMachine";
import PartsInventory from "./PartsInventory";

export const metadata: Metadata = {
  title: "Platform",
  description:
    "The Mimir execution layer, part by part — from API ingestion to the immutable audit log.",
};

const MODES = [
  {
    label: "Mode 1 — You have software",
    title: "Make it AI-operable",
    body: "Bring an API or OpenAPI spec. Mimir maps the surface, machines the tools, and hands your team an operator.",
    points: ["API connection", "Automatic tool generation", "Agent + execution runtime"],
  },
  {
    label: "Mode 2 — You have an idea",
    title: "Start AI-native",
    body: "No backend yet? Mimir generates schema, backend, and API with the runtime built in from the first line.",
    points: ["Generated database schema", "Generated backend + API", "Agent runtime included"],
  },
];

export default function PlatformPage() {
  return (
    <div>
      {/* Header entry */}
      <section className="rule-b">
        <div className="rule-b flex flex-wrap items-center justify-between gap-3 px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
          <span>Entry 000 / Schematic — full assembly</span>
          <span>DOC. MMR-PLT-01</span>
        </div>
        <div className="px-6 pb-16 pt-14 xl:pl-20">
          <Scramble
            as="h1"
            className="display block max-w-4xl text-5xl sm:text-7xl"
            text="Every system, as tools an AI can run."
          />
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ash">
            <span className="font-mono text-base text-bone">GET /orders</span> becomes{" "}
            <span className="font-mono text-base text-acid">get_orders()</span>. That one
            conversion, applied to everything your software can do — the rest of the
            machine exists to make it safe.
          </p>
        </div>
      </section>

      <TapeDivider />
      <ConversionMachine />
      <PartsInventory />

      {/* Modes */}
      <section className="rule-b">
        <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
          Entry 003 / Two ways in
        </div>
        <Reveal className="grid md:grid-cols-2">
          {MODES.map((m, i) => (
            <div
              key={m.label}
              data-reveal
              className={`px-6 py-12 xl:pl-20 ${i === 0 ? "rule-b md:border-b-0 md:border-r md:border-rule" : ""}`}
            >
              <p className="engrave">{m.label}</p>
              <h2 className="display mt-4 text-3xl">{m.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ash">{m.body}</p>
              <ul className="mt-6 space-y-2 font-mono text-xs uppercase tracking-wider text-ash">
                {m.points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <span aria-hidden className="h-1.5 w-1.5 bg-acid" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Close */}
      <section className="bg-acid px-6 py-14 text-carbon xl:pl-20">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="display text-3xl sm:text-4xl">See your API become an operator.</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-wider">Commissioning takes about four minutes</p>
          </div>
          <Link
            href="/signup"
            className="inline-flex shrink-0 items-center gap-2 border border-carbon bg-carbon px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-acid transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            Request access →
          </Link>
        </div>
      </section>
    </div>
  );
}
