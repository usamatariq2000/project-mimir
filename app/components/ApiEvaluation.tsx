"use client";

import { useEffect, useRef, useState } from "react";

/* The coupling evaluation, shared by the deck's "add system" panel and the
   signup commissioning flow.

   openapi mode — a documented API: fetch, type, machine. Clean and fast.
   text mode — an API that only lives in someone's notes: Mimir reads the
   prose, infers the endpoints, scores its own confidence, and holds the
   shaky ones for a human yes. Confirming is part of the interaction. */

export interface EvalResult {
  tools: number;
  pending: number;
}

interface InferredTool {
  name: string;
  confidence: number;
  source: string;
}

const INFERRED: InferredTool[] = [
  { name: "create_shipment", confidence: 96, source: "«to book a shipment, POST the order payload…»" },
  { name: "track_shipment", confidence: 91, source: "«tracking is available at /track with the ref…»" },
  { name: "get_rates", confidence: 88, source: "«rates can be queried per zone…»" },
  { name: "cancel_shipment", confidence: 74, source: "«cancellations… email ops OR use the cancel route?»" },
  { name: "update_address", confidence: 61, source: "«address changes might go through /amend…»" },
];

const OPENAPI_STAGES = [
  "fetching spec · openapi 3.1",
  "12 endpoints discovered",
  "schemas typed · parameters validated",
  "permissions defaulted · writes gated",
];

const TEXT_STAGES = [
  "reading document · 2,412 words",
  "no spec found — switching to inference",
  "extracting endpoint candidates from prose",
  "drafting schemas from examples in the text",
];

export default function ApiEvaluation({
  mode,
  onDone,
  compact = false,
}: {
  mode: "openapi" | "text";
  onDone: (r: EvalResult) => void;
  compact?: boolean;
}) {
  const stages = mode === "openapi" ? OPENAPI_STAGES : TEXT_STAGES;
  const [stage, setStage] = useState(0);
  const [showTools, setShowTools] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    stages.forEach((_, i) =>
      timers.current.push(setTimeout(() => setStage(i + 1), 700 * (i + 1)))
    );
    timers.current.push(
      setTimeout(() => setShowTools(true), 700 * (stages.length + 1))
    );
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = INFERRED.filter((t) => t.confidence < 80 && !confirmed.includes(t.name));
  const solid = INFERRED.filter((t) => t.confidence >= 80 || confirmed.includes(t.name));

  const finish = () => {
    setFinished(true);
    onDone(
      mode === "openapi"
        ? { tools: 12, pending: 0 }
        : { tools: solid.length, pending: pending.length }
    );
  };

  return (
    <div className={`plate-sunken font-mono text-xs ${compact ? "p-4" : "p-5"}`}>
      {/* stages */}
      <div className="space-y-1.5">
        {stages.map((s, i) => (
          <p key={s} className={stage > i ? "text-ash" : stage === i ? "animate-pulse text-acid" : "hidden"}>
            {stage > i ? "✓" : "▸"} {s}
          </p>
        ))}
      </div>

      {/* openapi: straight to the verdict */}
      {mode === "openapi" && showTools && !finished && (
        <div className="mt-4 border-t border-rule-soft pt-3">
          <p className="text-acid">✓ 12 tools machined · registry updated</p>
          <button type="button" onClick={finish} className="btn-primary mt-3 !px-3 !py-1.5 !text-[0.62rem]">
            Couple system
          </button>
        </div>
      )}

      {/* text: inferred tools with confidence + confirmation */}
      {mode === "text" && showTools && (
        <div className="mt-4 space-y-2.5 border-t border-rule-soft pt-3">
          {INFERRED.map((t) => {
            const ok = t.confidence >= 80 || confirmed.includes(t.name);
            return (
              <div key={t.name}>
                <div className="flex items-center justify-between gap-3">
                  <span className={ok ? "text-bone" : "text-ash"}>
                    {ok ? "✓" : "⚠"} {t.name}()
                  </span>
                  <span className={`shrink-0 ${ok ? "text-acid" : "text-ember"}`}>
                    {t.confidence}%
                  </span>
                </div>
                <div className="mt-1 h-0.5 w-full bg-soot-2">
                  <div
                    className={ok ? "h-full bg-acid" : "h-full bg-ember"}
                    style={{ width: `${t.confidence}%`, transition: "width 0.8s ease" }}
                  />
                </div>
                <p className="mt-0.5 text-[0.62rem] text-dust">{t.source}</p>
                {!ok && !finished && (
                  <button
                    type="button"
                    onClick={() => setConfirmed((c) => [...c, t.name])}
                    className="mt-1 border border-rule px-2 py-1 text-[0.6rem] uppercase tracking-wider text-ash transition-colors hover:border-acid hover:text-acid"
                  >
                    Looks right — machine it
                  </button>
                )}
              </div>
            );
          })}
          {!finished && (
            <div className="border-t border-rule-soft pt-3">
              <p className="text-dust">
                {pending.length
                  ? `${pending.length} low-confidence tool${pending.length > 1 ? "s" : ""} will stay held for review`
                  : "all inferences confirmed"}
              </p>
              <button type="button" onClick={finish} className="btn-primary mt-2 !px-3 !py-1.5 !text-[0.62rem]">
                Couple system · {solid.length} tools now
              </button>
            </div>
          )}
        </div>
      )}

      {finished && (
        <p className="mt-3 border-l-2 border-acid pl-3 text-acid">
          ✓ coupling complete
          {mode === "text" && pending.length > 0 && (
            <span className="text-dust"> · {pending.length} held in review queue</span>
          )}
        </p>
      )}
    </div>
  );
}
