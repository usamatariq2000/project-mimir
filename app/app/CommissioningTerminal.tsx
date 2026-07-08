"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  engineClarifyDraft,
  engineCommitSystem,
  type CoupleAuth,
  type DraftInterpretation,
} from "../lib/engine";

/* Commissioning terminal — verify-before-commit onboarding. The engine has
   inferred an interpretation from pasted docs; here the operator reviews the
   whole reading AND answers the AI's targeted questions before anything is
   saved. Confirmation + confidence together are the accuracy gate. Styled as a
   mission-control commissioning console within Operations Ledger — no glow. */

type Msg = { role: "ai" | "operator"; content: string };

export default function CommissioningTerminal({
  name,
  draft,
  auth,
  onCommitted,
  onClose,
}: {
  name: string;
  draft: DraftInterpretation;
  auth?: CoupleAuth;
  onCommitted: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [interp, setInterp] = useState<DraftInterpretation>(draft);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // deterministic local edit — click a tool's badge to gate/ungate it. The edited
  // interpretation is what gets committed, so this sticks.
  const toggleGate = (name: string) =>
    setInterp((p) => ({
      ...p,
      tools: p.tools.map((t) =>
        t.name === name ? { ...t, permission: t.permission === "approval" ? "auto" : "approval" } : t
      ),
    }));

  // Opening message is derived from the gaps — no server round-trip needed.
  useEffect(() => {
    const gaps = draft.gaps ?? [];
    const opening =
      gaps.length === 0
        ? `I read your notes and interpreted ${draft.tools.length} operation(s). Everything looks unambiguous — review the reading on the left and commit when it's right.`
        : `I read your notes and interpreted ${draft.tools.length} operation(s). Before I commit this system I need to confirm ${gaps.length} thing(s):`;
    const qs = gaps.map((g, i) => `${i + 1}. ${g.question}`).join("\n");
    setMessages([{ role: "ai", content: qs ? `${opening}\n\n${qs}` : opening }]);
  }, [draft]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const gaps = interp.gaps ?? [];
  const caps = interp.capabilities ?? {};
  const canCommit = (interp.base_url ?? "").trim().length > 0 && interp.tools.length > 0 && confirmed;
  // suggested vocabulary + anything the operator confirmed, shown together
  const glossary = { ...(caps.glossary_suggestions ?? {}), ...(interp.context?.glossary ?? {}) };
  const gatedCount = interp.tools.filter((t) => t.permission === "approval").length;
  const holistic = `${caps.system_purpose || "This system"} It exposes ${interp.tools.length} operation(s)${
    gatedCount ? `, ${gatedCount} held for approval` : ""
  }${interp.base_url ? ` at ${interp.base_url}` : ""}.`;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const history = messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }));
    setMessages((m) => [...m, { role: "operator", content: text }]);
    setBusy(true);
    const res = await engineClarifyDraft(interp, text, history);
    setBusy(false);
    if (!res) {
      setError("The engine didn't respond — try again, or commit if the reading is already right.");
      return;
    }
    setInterp(res.interpretation);
    setMessages((m) => [...m, { role: "ai", content: res.reply }]);
  };

  const commit = async () => {
    if (!canCommit || committing) return;
    setCommitting(true);
    setError(null);
    const res = await engineCommitSystem(name, interp, auth);
    setCommitting(false);
    if (!res) {
      setError("Commit failed — check the base URL is reachable and try again.");
      return;
    }
    await onCommitted();
  };

  const short = useMemo(
    () => (interp.title || name).slice(0, 32).toUpperCase(),
    [interp.title, name]
  );

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-carbon/90 p-6" role="dialog" aria-label="Commission a new system">
      <div className="plate flex h-[82vh] w-full max-w-5xl flex-col">
        <div className="rule-b flex items-center justify-between px-5 py-3">
          <p className="engrave flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse bg-acid" aria-hidden />
            Commissioning · {short}
          </p>
          <button type="button" onClick={onClose} className="font-mono text-xs text-ash hover:text-bone">
            ✕ abort
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          {/* LEFT — the interpretation under review */}
          <div data-lenis-prevent className="min-h-0 overflow-y-auto border-rule-soft p-5 md:border-r">
            <p className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-ash">System purpose</p>
            <p className="mb-4 text-sm text-bone">{caps.system_purpose || "— (unconfirmed)"}</p>

            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-ash">
                Interpreted {interp.tools.length} operation(s)
              </p>
              <p className="font-mono text-[0.62rem] text-dust">base: {interp.base_url || "— none yet"}</p>
            </div>
            <ul className="space-y-1.5">
              {interp.tools.map((t) => (
                <li key={t.name} className="border border-rule-soft px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-xs text-bone">
                      <span className="text-dust">{t.method}</span> {t.path}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleGate(t.name)}
                      title="click to gate / un-gate this operation"
                      className={`shrink-0 border px-1.5 font-mono text-[0.58rem] uppercase tracking-wider transition-colors ${
                        t.permission === "approval"
                          ? "border-ember/50 text-ember hover:bg-ember/10"
                          : "border-acid/40 text-acid hover:bg-acid/10"
                      }`}
                    >
                      {t.permission === "approval" ? "gated ⇄" : "read ⇄"}
                    </button>
                  </div>
                  <p className="mt-0.5 font-mono text-[0.62rem] text-ash">
                    {caps.tools?.[t.name] || t.description || t.name}
                  </p>
                </li>
              ))}
            </ul>

            {(caps.joint_capabilities?.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-ash">Joint capabilities</p>
                <ul className="list-disc pl-4 text-xs text-dust">
                  {caps.joint_capabilities!.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {(caps.risks?.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-ember">Risks held for approval</p>
                <ul className="list-disc pl-4 text-xs text-dust">
                  {caps.risks!.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {Object.keys(glossary).length > 0 && (
              <div className="mt-4">
                <p className="mb-1 font-mono text-[0.62rem] uppercase tracking-wider text-ash">
                  Vocabulary <span className="text-dust">— tell me in chat if it's wrong or incomplete</span>
                </p>
                <ul className="space-y-0.5">
                  {Object.entries(glossary).map(([term, meaning]) => (
                    <li key={term} className="font-mono text-[0.68rem] text-dust">
                      <span className="text-bone">{term}</span> — {meaning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 border-t border-rule-soft pt-3 font-mono text-[0.6rem] text-dust">
              Everything here is editable — click a badge to gate an operation, or just tell the engine in chat what to fix.
            </p>
          </div>

          {/* RIGHT — the interview */}
          <div className="flex min-h-0 flex-col">
            <div ref={logRef} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "ai" ? "" : "text-right"}>
                  <p className="mb-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-dust">
                    {m.role === "ai" ? "engine" : "operator"}
                  </p>
                  <p className={`inline-block whitespace-pre-wrap text-sm ${m.role === "ai" ? "text-bone" : "text-acid"}`}>
                    {m.content}
                  </p>
                </div>
              ))}
              {busy && <p className="font-mono text-[0.62rem] text-ash">engine considering…</p>}
            </div>

            {gaps.length > 0 && (
              <div className="rule-t px-5 py-2">
                <p className="font-mono text-[0.58rem] uppercase tracking-wider text-ash">
                  {gaps.length} open question(s) — {gaps.map((g) => g.id).join(", ")}
                </p>
              </div>
            )}

            {error && <p className="px-5 pb-1 font-mono text-[0.62rem] text-ember">{error}</p>}

            <div className="rule-t flex items-center gap-2 p-3">
              <input
                className="field flex-1 font-mono"
                placeholder="Answer the engine — e.g. 'base URL is https://api.acme.com'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                aria-label="Reply to the engine"
                disabled={busy}
              />
              <button
                type="button"
                onClick={send}
                disabled={busy || !input.trim()}
                className="border border-rule px-3 py-2 font-mono text-xs text-bone hover:border-dust disabled:opacity-40"
              >
                send
              </button>
            </div>

            <div className="rule-t p-3">
              <p className="mb-2 text-xs text-bone">{holistic}</p>
              <label className="mb-2 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={(interp.base_url ?? "").trim().length === 0}
                  className="mt-0.5 accent-acid"
                  aria-label="Confirm this reading is correct"
                />
                <span className="font-mono text-[0.66rem] text-ash">
                  I&apos;ve reviewed this reading and it&apos;s correct.
                  {(interp.base_url ?? "").trim().length === 0 && " (set a base URL first)"}
                  {gaps.length > 0 && ` ${gaps.length} question(s) still open.`}
                </span>
              </label>
              <button
                type="button"
                onClick={commit}
                disabled={!canCommit || committing}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                {committing ? "committing…" : "Confirm & commit"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
