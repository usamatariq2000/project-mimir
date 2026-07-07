"use client";

import { useEffect, useRef, useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import {
  SYSTEMS,
  LIVENESS,
  ACTIVITY_LOG,
  API_UPDATE_DIFFS,
  type ActivityEntry,
  type ConnectedSystem,
} from "../lib/mock-data";

const NEW_SYSTEM_LIVENESS = { latencyMs: 98, uptime: 100, lastIncident: "none — just coupled" };

/* The deck's own scroll indicator: a segmented signal meter (distinct from
   the marketing pages' needle gauge — this is an instrument, not a rule).
   Cells fill as the panel scrolls; click a cell to jump there. */
function PanelMeter({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const CELLS = 18;
  const [filled, setFilled] = useState(0);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollable(max > 8);
      setFilled(max > 0 ? Math.round((el.scrollTop / max) * CELLS) : 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [target]);

  if (!scrollable) return null;

  return (
    <div
      aria-hidden
      className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1"
    >
      {Array.from({ length: CELLS }, (_, i) => (
        <button
          key={i}
          type="button"
          tabIndex={-1}
          onClick={() => {
            const el = target.current;
            if (!el) return;
            el.scrollTo({
              top: (i / (CELLS - 1)) * (el.scrollHeight - el.clientHeight),
              behavior: "smooth",
            });
          }}
          className={`h-2 w-2 border transition-colors duration-150 ${
            i < filled
              ? "border-acid bg-acid"
              : i === filled
                ? "border-acid bg-acid/30"
                : "border-rule bg-carbon/60"
          }`}
        />
      ))}
    </div>
  );
}

/* The Monitor tab: system liveness up top, the activity ledger below, and
   the interactive "Update APIs" flow per system — scan the spec, show the
   diff, apply, watch the tool count tick up. */

type UpdatePhase = "idle" | "scanning" | "found" | "applying" | "current";

function UpdateFlow({
  systemId,
  onApplied,
  tourTarget,
}: {
  systemId: string;
  onApplied: (n: number) => void;
  tourTarget?: boolean;
}) {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const diff = API_UPDATE_DIFFS[systemId] ?? { added: [], changed: [] };
  const total = diff.added.length + diff.changed.length;

  const scan = () => {
    setPhase("scanning");
    setTimeout(() => setPhase(total ? "found" : "current"), 1600);
  };
  const apply = () => {
    setPhase("applying");
    setTimeout(() => {
      onApplied(diff.added.length);
      setPhase("current");
    }, 1400);
  };

  return (
    <div data-tour={tourTarget ? "update" : undefined} className="mt-3 border-t border-rule-soft pt-3">
      {phase === "idle" && (
        <button type="button" onClick={scan} className="btn-secondary !px-3 !py-1.5 !text-[0.62rem]">
          ⟳ Update APIs
        </button>
      )}
      {phase === "scanning" && (
        <p className="font-mono text-[0.65rem] text-ash">
          <span className="animate-pulse text-acid">▓▒░</span> reading OpenAPI spec · diffing
          against registry…
        </p>
      )}
      {phase === "found" && (
        <div className="space-y-1.5 font-mono text-[0.65rem]">
          {diff.added.map((a) => (
            <p key={a} className="text-acid">+ {a}</p>
          ))}
          {diff.changed.map((c) => (
            <p key={c} className="text-ash">~ {c}</p>
          ))}
          <button type="button" onClick={apply} className="btn-primary mt-2 !px-3 !py-1.5 !text-[0.62rem]">
            Apply {total} change{total > 1 ? "s" : ""} → regenerate tools
          </button>
        </div>
      )}
      {phase === "applying" && (
        <p className="animate-pulse font-mono text-[0.65rem] text-acid">
          machining new tools · updating context…
        </p>
      )}
      {phase === "current" && (
        <p className="font-mono text-[0.65rem] uppercase tracking-wider text-acid">
          ✓ context current · registry in sync
        </p>
      )}
    </div>
  );
}

export default function MonitorPanel({
  sessionRuns,
  systems = SYSTEMS,
  realActivity = null,
  memories = null,
}: {
  sessionRuns: ActivityEntry[];
  systems?: ConnectedSystem[];
  realActivity?: { time: string; intent: string; tools: number; systems: string[]; status: "filed" | "held"; operator: string }[] | null;
  memories?: { content: string; at: string }[] | null;
}) {
  const [toolCounts, setToolCounts] = useState<Record<string, number>>(
    Object.fromEntries(systems.map((s) => [s.id, s.toolCount]))
  );
  const activity: ActivityEntry[] = realActivity
    ? realActivity.map((r) => ({ ...r, status: r.status === "held" ? "held" : "filed" }))
    : [...sessionRuns, ...ACTIVITY_LOG];
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative min-h-0 flex-1 overflow-hidden">
      <PanelMeter target={scrollRef} />
      <div
        ref={scrollRef}
        data-lenis-prevent
        className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
      {/* ── Liveness ── */}
      <div className="rule-b px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash">
        Monitor 01 / System liveness
      </div>
      <div className="grid gap-px bg-rule-soft sm:grid-cols-3" data-tour="liveness">
        {systems.map((s) => {
          const real = s.latencyMs !== undefined;
          const live = LIVENESS[s.id] ?? NEW_SYSTEM_LIVENESS;
          const degraded = s.status !== "online";
          return (
            <div key={s.id} className="bg-carbon p-5">
              <div className="flex items-center justify-between">
                <p className="display text-lg">{s.name}</p>
                <span className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-wider">
                  <span className={`h-2 w-2 ${degraded ? "animate-pulse bg-ember" : "animate-pulse bg-acid"}`} aria-hidden />
                  <span className={degraded ? "text-ember" : "text-acid"}>{s.status}</span>
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[0.65rem]">
                <div>
                  <p className="text-dust">{real ? "latency · live" : "latency"}</p>
                  <p className="text-bone"><NumberTicker value={real ? s.latencyMs! : live.latencyMs} className="text-bone" />ms</p>
                </div>
                <div>
                  <p className="text-dust">uptime 30d</p>
                  <p className="text-bone">{real ? "measuring" : `${live.uptime}%`}</p>
                </div>
                <div>
                  <p className="text-dust">tools</p>
                  <p className="text-bone">{toolCounts[s.id] ?? s.toolCount}</p>
                </div>
              </div>
              <div className="mt-3 h-1 w-full bg-soot-2" aria-hidden>
                <div className={degraded ? "h-full bg-ember" : "h-full bg-acid"} style={{ width: `${live.uptime}%` }} />
              </div>
              <p className="mt-2 font-mono text-[0.62rem] text-dust">
                {real ? "pinged from the engine just now" : `incident: ${live.lastIncident}`}
              </p>
              <UpdateFlow
                systemId={s.id}
                tourTarget={s.id === "stripe"}
                onApplied={(n) => setToolCounts((tc) => ({ ...tc, [s.id]: (tc[s.id] ?? s.toolCount) + n }))}
              />
            </div>
          );
        })}
      </div>

      {/* ── Activity ── */}
      <div className="rule-t rule-b px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash">
        Monitor 02 / Activity ledger — {realActivity ? "live from the engine" : "today (demo)"}
      </div>
      <div data-tour="activity" className="px-5 pb-10">
        <div className="grid grid-cols-4 gap-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-dust sm:grid-cols-[4rem_1fr_10rem_6rem_5rem]">
          <span>Time</span>
          <span className="hidden sm:block">Intent</span>
          <span>Systems</span>
          <span>Operator</span>
          <span>Status</span>
        </div>
        {activity.map((a, i) => (
          <div
            key={a.time + i}
            className="rule-t grid grid-cols-4 items-baseline gap-4 py-3.5 font-mono text-[0.72rem] transition-colors hover:bg-soot sm:grid-cols-[4rem_1fr_10rem_6rem_5rem]"
          >
            <span className="text-dust">{a.time}</span>
            <span className="hidden truncate text-bone sm:block">❯ {a.intent}</span>
            <span className="truncate text-ash">{a.systems.join(" · ")}</span>
            <span className="text-ash">{a.operator}</span>
            <span className={a.status === "held" ? "text-ember" : "text-acid"}>
              {a.status === "held" ? "⏸ held" : a.status === "approved" ? "✓ appr." : "✓ filed"}
            </span>
          </div>
        ))}
      </div>

      {/* ── The growing brain ── */}
      <div className="rule-t rule-b px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ash">
        Monitor 03 / Learned knowledge {memories ? "— distilled from conversations" : "— engine offline"}
      </div>
      <div className="px-5 pb-12 pt-2">
        {(memories ?? []).length === 0 && (
          <p className="py-3 font-mono text-[0.72rem] text-dust">
            Nothing learned yet — teach it in conversation ("remember that…") and facts land here.
          </p>
        )}
        {(memories ?? []).map((m, i) => (
          <div key={i} className="rule-t flex items-baseline gap-4 py-3 font-mono text-[0.72rem]">
            <span className="text-acid">◆</span>
            <span className="flex-1 text-bone">{m.content}</span>
            <span className="shrink-0 text-dust">{m.at.slice(0, 10)}</span>
          </div>
        ))}
      </div>
      </div>
    </main>
  );
}
