"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import ApiEvaluation from "../components/ApiEvaluation";
import { SAMPLE_INTENTS } from "../lib/mock-data";

gsap.registerPlugin(useGSAP);

/* Commissioning: not a form wizard but an assembly line. Each answer adds a
   physical part to the operator schematic on the right. Front-end only. */

const INDUSTRIES = ["E-commerce", "Fintech", "SaaS", "Logistics", "Support", "Other"];
const TEAM_SIZES = ["Just me", "2–10", "11–50", "51–200", "200+"];
const CATALOG = [
  { id: "stripe", name: "Stripe", kind: "Payments" },
  { id: "shopify", name: "Shopify", kind: "Commerce" },
  { id: "zendesk", name: "Zendesk", kind: "Support" },
  { id: "custom", name: "Custom API", kind: "OpenAPI spec" },
];
const AUTHORITY = [
  { id: "read", label: "Read data (orders, tickets, payments)", fixed: "auto" as const },
  { id: "refund", label: "Issue refunds", fixed: null },
  { id: "message", label: "Send messages to customers", fixed: null },
  { id: "inventory", label: "Change inventory or records", fixed: null },
];
const RED_LINES = [
  "Never delete customer data",
  "Never contact customers after 9pm",
  "Never refund above the threshold without approval",
  "Never touch payroll or HR systems",
];

const STEP_META = [
  { part: "Nameplate", prompt: "What operation is this?" },
  { part: "Couplings", prompt: "Which systems will it operate?" },
  { part: "Vault", prompt: "Seal the keys." },
  { part: "Governor", prompt: "How much authority does it get?" },
  { part: "Red lines", prompt: "What must it never do?" },
  { part: "First motion", prompt: "What should it try first?" },
];

export default function CommissioningFlow() {
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  // Captured configuration (front-end only)
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [specUrl, setSpecUrl] = useState("");
  const [docMode, setDocMode] = useState<"openapi" | "text">("openapi");
  const [notes, setNotes] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalDone, setEvalDone] = useState(false);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [approvals, setApprovals] = useState<Record<string, boolean>>({
    refund: true,
    message: true,
    inventory: true,
  });
  const [threshold, setThreshold] = useState(250);
  const [redLines, setRedLines] = useState<string[]>([RED_LINES[0]]);
  const [intents, setIntents] = useState<string[]>([]);

  const { contextSafe } = useGSAP({ scope: root });

  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return company.trim().length > 1 && industry && teamSize;
      case 1: return systems.length > 0;
      case 2: return systems.every((s) =>
        s === "custom"
          ? (docMode === "openapi" ? specUrl.trim().length > 0 : evalDone)
          : (keys[s] ?? "").length > 3
      );
      case 3: return true;
      case 4: return redLines.length > 0;
      case 5: return intents.length > 0;
      default: return false;
    }
  }, [step, company, industry, teamSize, systems, specUrl, keys, redLines, intents, docMode, evalDone]);

  const goto = contextSafe((next: number) => {
    gsap.fromTo(
      "[data-pane]",
      { autoAlpha: 1, x: 0 },
      {
        autoAlpha: 0,
        x: next > step ? -20 : 20,
        duration: 0.2,
        onComplete: () => {
          setStep(next);
          gsap.fromTo(
            "[data-pane]",
            { autoAlpha: 0, x: next > step ? 20 : -20 },
            { autoAlpha: 1, x: 0, duration: 0.28 }
          );
        },
      }
    );
    gsap.fromTo(
      `[data-part="${next > step ? step : next}"]`,
      { scale: 0.9 },
      { scale: 1, duration: 0.5, ease: "back.out(2)" }
    );
  });

  const commission = contextSafe(() => {
    setDone(true);
    gsap.fromTo(
      "[data-commissioned]",
      { autoAlpha: 0, scale: 0.97 },
      { autoAlpha: 1, scale: 1, duration: 0.6, ease: "power2.out" }
    );
    setTimeout(() => router.push("/app"), 2600);
  });

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedGridPattern
        numSquares={24}
        maxOpacity={0.06}
        duration={3}
        className={cn("[mask-image:radial-gradient(500px_circle_at_30%_10%,white,transparent)]", "inset-x-0 top-0 h-full")}
      />
      <div className="glow pointer-events-none absolute inset-x-0 top-0 h-96" aria-hidden />
      <div ref={root} className="relative mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
      {/* ── Left: the questions ── */}
      <div className="flex flex-col">
        <Link href="/" className="engrave">← Mimir</Link>

        <div className="mt-6 flex items-center gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={6}>
          {STEP_META.map((m, i) => (
            <span
              key={m.part}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-bronze" : "bg-hairline"}`}
            />
          ))}
        </div>

        <div data-pane className="flex flex-1 flex-col justify-center py-10">
          <p className="engrave">
            Commissioning · Part {step + 1} of 6 — {STEP_META[step].part}
          </p>
          <h1 className="display mt-3 max-w-md text-4xl">{STEP_META[step].prompt}</h1>

          {step === 0 && (
            <div className="mt-8 max-w-md space-y-5">
              <input className="field" placeholder="Company or project name" value={company} onChange={(e) => setCompany(e.target.value)} autoFocus />
              <div>
                <p className="mb-2 text-sm text-slate">Industry</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((v) => (
                    <button key={v} type="button" onClick={() => setIndustry(v)}
                      className={`rounded-lg border px-3.5 py-2 text-sm transition ${industry === v ? "border-bronze bg-bronze/10 text-bronze-deep" : "border-hairline bg-paper text-slate hover:border-steel"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-slate">Team size</p>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SIZES.map((v) => (
                    <button key={v} type="button" onClick={() => setTeamSize(v)}
                      className={`rounded-lg border px-3.5 py-2 text-sm transition ${teamSize === v ? "border-bronze bg-bronze/10 text-bronze-deep" : "border-hairline bg-paper text-slate hover:border-steel"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-8 max-w-md space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {CATALOG.map((c) => (
                  <button key={c.id} type="button" onClick={() => toggle(systems, setSystems, c.id)}
                    className={`plate p-4 text-left transition ${systems.includes(c.id) ? "!border-bronze ring-2 ring-bronze/25" : "hover:-translate-y-0.5"}`}>
                    <p className="font-medium">{c.name}</p>
                    <p className="mt-0.5 text-xs text-slate">{c.kind}</p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate">Pick everything the operator should reach. You can couple more systems later.</p>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 max-w-md space-y-4">
              {systems.filter((s) => s !== "custom").map((s) => (
                <div key={s}>
                  <label className="mb-1.5 block text-sm text-slate" htmlFor={`key-${s}`}>
                    {CATALOG.find((c) => c.id === s)?.name} API key
                  </label>
                  <input id={`key-${s}`} type="password" className="field font-mono" placeholder="sk_live_…"
                    value={keys[s] ?? ""} onChange={(e) => setKeys((k) => ({ ...k, [s]: e.target.value }))} />
                </div>
              ))}
              {systems.includes("custom") && evaluating && (
                <div>
                  <div className="rule-b mb-3 flex items-center justify-between pb-2">
                    <p className="font-mono text-xs text-bone">
                      Custom API <span className="text-dust">· inferred from a text document</span>
                    </p>
                    {!evalDone && (
                      <button
                        type="button"
                        onClick={() => setEvaluating(false)}
                        className="font-mono text-[0.65rem] uppercase tracking-wider text-slate hover:text-bone"
                      >
                        ← edit
                      </button>
                    )}
                  </div>
                  <ApiEvaluation mode="text" compact onDone={() => setEvalDone(true)} />
                </div>
              )}
              {systems.includes("custom") && !evaluating && (
                <div>
                  <p className="mb-2 text-sm text-slate">Custom API — how is it documented?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setDocMode("openapi"); setEvaluating(false); setEvalDone(false); }}
                      className={`border p-3 text-left transition-colors ${docMode === "openapi" ? "border-acid bg-soot" : "border-rule hover:border-dust"}`}>
                      <p className="font-mono text-xs">OpenAPI / Swagger</p>
                      <p className="mt-1 text-[0.7rem] text-slate">A proper spec exists</p>
                    </button>
                    <button type="button" onClick={() => { setDocMode("text"); setEvaluating(false); setEvalDone(false); }}
                      className={`border p-3 text-left transition-colors ${docMode === "text" ? "border-acid bg-soot" : "border-rule hover:border-dust"}`}>
                      <p className="font-mono text-xs">Only a text document</p>
                      <p className="mt-1 text-[0.7rem] text-slate">Notes or a wiki page — Mimir infers the tools</p>
                    </button>
                  </div>
                  {docMode === "openapi" ? (
                    <input id="spec-url" aria-label="OpenAPI spec URL" className="field mt-3 font-mono" placeholder="https://api.yours.com/openapi.json"
                      value={specUrl} onChange={(e) => setSpecUrl(e.target.value)} />
                  ) : (
                    <>
                      <textarea aria-label="API notes" className="field mt-3 min-h-24 font-mono"
                        placeholder="Paste the notes — “to book a shipment POST the order payload to /shipments…”"
                        value={notes} onChange={(e) => setNotes(e.target.value)} />
                      <button type="button" disabled={notes.trim().length < 20} onClick={() => setEvaluating(true)}
                        className="btn-secondary mt-3 !px-3 !py-2 !text-[0.65rem] disabled:cursor-not-allowed disabled:opacity-40">
                        Evaluate the document
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="flex items-start gap-2 text-sm text-slate">
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                Keys are sealed into the vault. The AI receives tools — never these values.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="mt-8 max-w-md space-y-3">
              {AUTHORITY.map((a) => (
                <div key={a.id} className="plate-sunken flex items-center justify-between gap-4 px-4 py-3">
                  <p className="text-sm">{a.label}</p>
                  {a.fixed ? (
                    <span className="engrave !text-signal">Auto</span>
                  ) : (
                    <button type="button" role="switch" aria-checked={approvals[a.id]}
                      onClick={() => setApprovals((p) => ({ ...p, [a.id]: !p[a.id] }))}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-wider transition ${approvals[a.id] ? "border-bronze bg-bronze/10 text-bronze-deep" : "border-hairline text-slate"}`}>
                      {approvals[a.id] ? "Ask me first" : "Run auto"}
                    </button>
                  )}
                </div>
              ))}
              <div className="plate-sunken px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="threshold">Auto-approve spend up to</label>
                  <span className="font-mono text-bronze-deep">${threshold}</span>
                </div>
                <input id="threshold" type="range" min={0} max={2000} step={50} value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="mt-3 w-full accent-[var(--bronze)]" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-8 max-w-md space-y-2.5">
              {RED_LINES.map((r) => (
                <button key={r} type="button" onClick={() => toggle(redLines, setRedLines, r)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${redLines.includes(r) ? "border-alert/50 bg-alert/5" : "border-hairline hover:border-steel"}`}>
                  <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${redLines.includes(r) ? "bg-alert" : "bg-hairline"}`} />
                  {r}
                </button>
              ))}
              <p className="pt-2 text-sm text-slate">Red lines are enforced by the runtime, not the prompt. The operator cannot cross them.</p>
            </div>
          )}

          {step === 5 && (
            <div className="mt-8 max-w-md space-y-2.5">
              {SAMPLE_INTENTS.map((s) => (
                <button key={s} type="button" onClick={() => toggle(intents, setIntents, s)}
                  className={`w-full rounded-lg border px-4 py-3 text-left font-mono text-xs transition ${intents.includes(s) ? "border-bronze bg-bronze/10 text-bronze-deep" : "border-hairline text-slate hover:border-steel"}`}>
                  ❯ {s}
                </button>
              ))}
            </div>
          )}

          <div className="mt-10 flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => goto(step - 1)} className="btn-secondary">Back</button>
            )}
            {step < 5 ? (
              <button type="button" disabled={!canContinue} onClick={() => goto(step + 1)}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                Attach part
              </button>
            ) : (
              <button type="button" disabled={!canContinue} onClick={commission}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                Commission operator
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: the assembling schematic ── */}
      <div className="plate-graphite relative hidden flex-col overflow-hidden p-8 lg:flex">
        <BorderBeam size={180} duration={10} colorFrom="#c8f31d" colorTo="#e8e4d8" />
        <p className="engrave-dark">Operator schematic · assembling</p>

        <div className="relative mt-8 flex-1">
          {/* Part 0 — nameplate */}
          <div data-part="0" className={`transition-opacity duration-500 ${company ? "opacity-100" : "opacity-25"}`}>
            <div className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-4">
              <p className="engrave-dark">Nameplate</p>
              <p className="display mt-1 text-xl text-white/95">{company || "—"}</p>
              <p className="mt-0.5 font-mono text-[0.7rem] text-white/45">
                {[industry, teamSize && `${teamSize} operators`].filter(Boolean).join(" · ") || "awaiting profile"}
              </p>
            </div>
          </div>

          {/* Part 1+2 — couplings */}
          <div data-part="1" className="mt-4">
            <p className="engrave-dark mb-2">Couplings</p>
            <div className="grid grid-cols-2 gap-2.5">
              {CATALOG.filter((c) => systems.includes(c.id)).map((c) => (
                <div key={c.id} className="rounded-lg border border-white/12 bg-white/[0.05] px-4 py-3">
                  <p className="text-sm text-white/90">{c.name}</p>
                  <p className="font-mono text-[0.65rem] text-white/45">
                    {step > 2 || (c.id === "custom" ? specUrl : keys[c.id]) ? "● sealed" : "○ awaiting key"}
                  </p>
                </div>
              ))}
              {systems.length === 0 && (
                <div className="rounded-lg border border-dashed border-white/15 px-4 py-3 font-mono text-[0.7rem] text-white/35">
                  no systems coupled
                </div>
              )}
            </div>
          </div>

          {/* Part 3 — governor */}
          <div data-part="3" className={`mt-4 transition-opacity duration-500 ${step >= 3 ? "opacity-100" : "opacity-25"}`}>
            <div className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-4">
              <p className="engrave-dark">Governor</p>
              <p className="mt-1 font-mono text-[0.7rem] leading-5 text-white/60">
                auto-spend ≤ ${threshold} · {Object.values(approvals).filter(Boolean).length} action classes gated
              </p>
            </div>
          </div>

          {/* Part 4 — red lines */}
          <div data-part="4" className={`mt-4 transition-opacity duration-500 ${step >= 4 ? "opacity-100" : "opacity-25"}`}>
            <div className="rounded-xl border border-alert/30 bg-alert/[0.06] px-5 py-4">
              <p className="engrave-dark !text-alert">Red lines</p>
              <p className="mt-1 font-mono text-[0.7rem] text-white/60">{redLines.length} hard constraints engraved</p>
            </div>
          </div>

          {/* Part 5 — first motion */}
          <div data-part="5" className={`mt-4 transition-opacity duration-500 ${step >= 5 ? "opacity-100" : "opacity-25"}`}>
            <div className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-4">
              <p className="engrave-dark">First motion</p>
              <p className="mt-1 font-mono text-[0.7rem] text-white/60">
                {intents.length ? `${intents.length} intents queued` : "awaiting instructions"}
              </p>
            </div>
          </div>
        </div>

        {/* Commissioned overlay */}
        {done && (
          <div data-commissioned className="absolute inset-0 grid place-items-center rounded-[18px] bg-[#0a0c12]/95 opacity-0">
            <div className="text-center">
              <span aria-hidden className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-gradient-to-b from-[#1a1a17] to-[#131311] shadow-[0_0_50px_-10px_rgba(200,243,29,0.8)]">
                <span className="h-4 w-4 rotate-45 rounded-[3px] bg-gradient-to-br from-volt-2 to-volt" />
              </span>
              <p className="display mt-6 text-3xl text-white/95">Operator commissioned</p>
              <p className="mt-2 font-mono text-xs text-white/50">
                {company || "your operation"} · {systems.length} systems · taking the deck…
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
