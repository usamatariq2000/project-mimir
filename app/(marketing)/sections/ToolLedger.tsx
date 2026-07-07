"use client";

import { useState } from "react";
import Scramble from "../../components/Scramble";
import Reveal from "../../components/Reveal";
import { SYSTEMS } from "../../lib/mock-data";

/* Entry 001. The core conversion, shown as ledger lines: endpoint in,
   tool out. Hovering a row exposes its execution contract. */
export default function ToolLedger() {
  const rows = SYSTEMS.flatMap((s) => s.tools.map((t) => ({ ...t, system: s.name })));
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section id="conversion" className="rule-b scroll-mt-14">
      <div className="rule-b px-6 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash xl:pl-20">
        Entry 002 / Conversion
      </div>
      <div className="px-6 py-14 xl:pl-20">
        <Scramble
          as="h2"
          className="display block text-4xl sm:text-6xl"
          text="Every endpoint becomes a tool."
        />
        <p className="mt-5 max-w-md text-ash">
          Point Mimir at an API. It reads the surface of your system and machines
          each capability into a typed, permissioned, executable tool.
        </p>

        <Reveal className="mt-12">
          <div data-reveal className="rule-t font-mono text-xs sm:text-sm">
            {rows.slice(0, 8).map((t) => {
              const id = t.system + t.name;
              const isOpen = open === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOpen(isOpen ? null : id)}
                  aria-expanded={isOpen}
                  className={`rule-b block w-full text-left transition-colors ${isOpen ? "bg-soot" : "hover:bg-soot"}`}
                >
                  <span className="grid grid-cols-[4.5rem_1fr_auto_1fr_auto] items-center gap-2 px-2 py-3.5 sm:gap-4">
                    <span className="text-dust">{t.method}</span>
                    <span className="truncate text-ash">{t.endpoint}</span>
                    <span className="text-acid">→</span>
                    <span className="truncate text-bone">{t.name}()</span>
                    <span className={`hidden sm:inline ${t.permission === "approval" ? "text-ember" : "text-acid"}`}>
                      {t.permission === "approval" ? "[gated]" : "[auto]"}
                    </span>
                  </span>
                  {isOpen && (
                    <span className="block px-2 pb-4 pl-[4.5rem] text-[0.7rem] leading-6 text-dust sm:pl-[calc(4.5rem+1rem)]">
                      {t.description} · system: {t.system} · schema: typed ·
                      retries: 3 · rate-limited · response normalized
                    </span>
                  )}
                </button>
              );
            })}
            <div className="rule-b px-2 py-3.5 text-dust">
              + 39 more tools generated from 3 systems
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
