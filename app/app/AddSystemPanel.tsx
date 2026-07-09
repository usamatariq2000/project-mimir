"use client";

import { useState } from "react";
import ApiEvaluation, { type EvalResult } from "../components/ApiEvaluation";
import CommissioningTerminal from "./CommissioningTerminal";
import {
  engineCoupleSystem,
  engineDraftSystem,
  engineDiscoverLogin,
  type CoupleAuth,
  type BusinessContext,
  type DraftInterpretation,
} from "../lib/engine";
import type { ConnectedSystem } from "../lib/mock-data";

/* Coupling a new system from the deck. Two ways in: a proper OpenAPI spec,
   or — for the APIs that only exist in somebody's notes — a pasted text
   document that Mimir evaluates and converts into tools interactively. */

export default function AddSystemPanel({
  onAdd,
  onClose,
  onCoupled,
  engineLive = false,
}: {
  onAdd: (s: ConnectedSystem) => void;
  onClose: () => void;
  onCoupled?: () => Promise<void> | void;
  engineLive?: boolean;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"openapi" | "text">("openapi");
  const [specUrl, setSpecUrl] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<CoupleAuth["type"]>("none");
  const [authToken, setAuthToken] = useState("");
  const [authHeader, setAuthHeader] = useState("X-API-Key");
  const [authValue, setAuthValue] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [notes, setNotes] = useState("");
  const [bizDesc, setBizDesc] = useState("");
  const [glossary, setGlossary] = useState("");
  const [coupling, setCoupling] = useState(false);
  const [coupleError, setCoupleError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [draft, setDraft] = useState<DraftInterpretation | null>(null);
  const [drafting, setDrafting] = useState(false);
  // login scheme (Credential Broker): service-account creds → discovered login recipe
  const [loginPath, setLoginPath] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [loginRecipe, setLoginRecipe] = useState<Record<string, unknown> | null>(null);
  const [discoverMsg, setDiscoverMsg] = useState<string | null>(null);

  const effectiveBaseUrl = (): string => {
    const b = baseUrl.trim();
    if (b) return b;
    try {
      return specUrl.trim() ? new URL(specUrl.trim()).origin : "";
    } catch {
      return "";
    }
  };

  const runDiscover = async () => {
    const base = effectiveBaseUrl();
    if (!base || !authUser.trim() || !authPass.trim()) {
      setDiscoverMsg("Enter the base URL, service-account username and password first.");
      return;
    }
    setDiscovering(true);
    setDiscoverMsg(null);
    setLoginRecipe(null);
    const res = await engineDiscoverLogin(base, authUser.trim(), authPass.trim(), {
      doc: mode === "text" ? notes.trim() : undefined,
      loginPath: loginPath.trim() || undefined,
    });
    setDiscovering(false);
    if (res?.ok && res.recipe) {
      setLoginRecipe(res.recipe as unknown as Record<string, unknown>);
      setDiscoverMsg(`✓ Login proven — token field "${res.recipe.token_path}". Sample token ${res.token_preview ?? ""}`);
    } else {
      setDiscoverMsg(res?.reason ? `✗ ${res.reason}` : "✗ Couldn't verify the login — check the base URL, path, and credentials.");
    }
  };

  const canEvaluate =
    name.trim().length > 1 &&
    // text mode needs only the notes — the commissioning interview elicits the
    // base URL (and confirms the rest) rather than demanding it up front.
    (mode === "openapi" ? specUrl.trim().length > 5 : notes.trim().length > 20);

  const couple = async () => {
    if (!result) return;
    // openapi + live engine → REAL coupling: ingestion, tools, evaluation
    if (mode === "openapi" && engineLive) {
      setCoupling(true);
      setCoupleError(null);
      const authCfg: CoupleAuth =
        authType === "bearer"
          ? { type: "bearer", token: authToken }
          : authType === "api_key"
            ? { type: "api_key", header: authHeader, value: authValue }
            : authType === "basic"
              ? { type: "basic", username: authUser, password: authPass }
              : { type: "none" };
      // parse the glossary textarea: one "term = meaning" per line
      const gloss: Record<string, string> = {};
      glossary.split("\n").forEach((line) => {
        const i = line.indexOf("=");
        if (i > 0) gloss[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      });
      const ctx: BusinessContext = {
        description: bizDesc.trim() || undefined,
        glossary: Object.keys(gloss).length ? gloss : undefined,
      };
      const real = await engineCoupleSystem(
        name.trim(),
        { specUrl: specUrl.trim() },
        baseUrl.trim() || new URL(specUrl.trim()).origin,
        authCfg,
        ctx
      );
      setCoupling(false);
      if (real) {
        await onCoupled?.();
        onClose();
        return;
      }
      setCoupleError("The engine could not ingest that spec — check the URL is reachable.");
      return;
    }
    // text-doc + live engine → REAL coupling: the model infers tools from the prose
    if (mode === "text" && engineLive) {
      setCoupling(true);
      setCoupleError(null);
      const real = await engineCoupleSystem(
        name.trim(),
        { doc: notes.trim() },
        baseUrl.trim()
      );
      setCoupling(false);
      if (real) {
        await onCoupled?.();
        onClose();
        return;
      }
      setCoupleError(
        "The engine could not infer any operations from those docs — add clearer endpoint/method details, or connect an OpenAPI spec."
      );
      return;
    }
    // offline path: local only (needs a live engine to infer tools from docs)
    onAdd({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: name.trim(),
      kind: mode === "openapi" ? "Custom API" : "Inferred from docs",
      status: "online",
      toolCount: result.tools,
      tools: [],
    });
    onClose();
  };

  // text mode + live engine → draft an interpretation and open the commissioning
  // terminal (verify-before-commit). Everything else keeps the mock evaluation.
  const startEvaluation = async () => {
    if (mode === "text" && engineLive) {
      setDrafting(true);
      setCoupleError(null);
      const d = await engineDraftSystem(name.trim(), { doc: notes.trim() }, baseUrl.trim());
      setDrafting(false);
      if (d) {
        setDraft(d);
        return;
      }
      setCoupleError("The engine could not infer operations from those docs — add clearer endpoint/method details.");
      return;
    }
    setEvaluating(true);
  };

  const buildAuthCfg = (): CoupleAuth =>
    authType === "bearer"
      ? { type: "bearer", token: authToken }
      : authType === "api_key"
        ? { type: "api_key", header: authHeader, value: authValue }
        : authType === "basic"
          ? { type: "basic", username: authUser, password: authPass }
          : authType === "login" && loginRecipe
            ? { type: "login", username: authUser, password: authPass, recipe: loginRecipe }
            : { type: "none" };

  // shared auth UI — used by both the OpenAPI and text-doc paths so a doc-ingested
  // system can authenticate too (credentials are vaulted; the AI never sees them).
  const authFields = (
    <div className="border-t border-rule-soft pt-3">
      <p className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ash">Authentication</p>
      <div className="flex flex-wrap gap-1.5">
        {(["none", "bearer", "api_key", "basic", "login"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setAuthType(t)}
            className={`border px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-wider transition-colors ${authType === t ? "border-acid bg-acid/10 text-acid" : "border-rule text-ash hover:border-dust"}`}
          >
            {t === "api_key" ? "API key" : t === "login" ? "login (auto-token)" : t}
          </button>
        ))}
      </div>
      {authType === "bearer" && (
        <input className="field mt-2 font-mono" type="password" placeholder="Bearer token (e.g. sk_test_…)" value={authToken} onChange={(e) => setAuthToken(e.target.value)} aria-label="Bearer token" />
      )}
      {authType === "api_key" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input className="field font-mono" placeholder="Header name" value={authHeader} onChange={(e) => setAuthHeader(e.target.value)} aria-label="API key header" />
          <input className="field font-mono" type="password" placeholder="Key value" value={authValue} onChange={(e) => setAuthValue(e.target.value)} aria-label="API key value" />
        </div>
      )}
      {authType === "basic" && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input className="field font-mono" placeholder="Username" value={authUser} onChange={(e) => setAuthUser(e.target.value)} aria-label="Basic auth username" />
          <input className="field font-mono" type="password" placeholder="Password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} aria-label="Basic auth password" />
        </div>
      )}
      {authType === "login" && (
        <div className="mt-2 space-y-2">
          <p className="font-mono text-[0.6rem] text-dust">
            Give a dedicated service-account login. Mimir discovers the login endpoint, proves it, then
            mints &amp; refreshes tokens itself — so an expiring token never breaks operations.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input className="field font-mono" placeholder="Service-account username" value={authUser} onChange={(e) => setAuthUser(e.target.value)} aria-label="Service account username" />
            <input className="field font-mono" type="password" placeholder="Password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} aria-label="Service account password" />
          </div>
          <input className="field font-mono" placeholder="Login path (optional — e.g. /auth/login; found from the docs if blank)" value={loginPath} onChange={(e) => setLoginPath(e.target.value)} aria-label="Login path" />
          <button
            type="button"
            onClick={runDiscover}
            disabled={discovering}
            className="border border-rule px-3 py-2 font-mono text-xs text-bone transition-colors hover:border-dust disabled:opacity-40"
          >
            {discovering ? "testing login…" : "Test & discover"}
          </button>
          {discoverMsg && (
            <p className={`font-mono text-[0.62rem] ${loginRecipe ? "text-acid" : "text-ember"}`}>{discoverMsg}</p>
          )}
        </div>
      )}
      {authType !== "none" && (
        <p className="mt-1.5 font-mono text-[0.6rem] text-dust">
          Sealed in the vault (encrypted). The AI never sees it — only the executor injects it.
        </p>
      )}
    </div>
  );

  if (draft) {
    return (
      <CommissioningTerminal
        name={name.trim()}
        draft={draft}
        auth={buildAuthCfg()}
        onCommitted={async () => {
          await onCoupled?.();
          onClose();
        }}
        onClose={() => setDraft(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-carbon/90 p-6" role="dialog" aria-label="Couple a new system">
      <div className="plate w-full max-w-xl">
        <div className="rule-b flex items-center justify-between px-5 py-3">
          <p className="engrave">Couple a new system</p>
          <button type="button" onClick={onClose} className="font-mono text-xs text-ash hover:text-bone">
            ✕ close
          </button>
        </div>

        <div data-lenis-prevent className="max-h-[75vh] overflow-y-auto p-5">
          {/* While evaluating, the form collapses to a summary line so the
              evaluation owns the panel. */}
          {evaluating && (
            <div className="rule-b mb-4 flex items-center justify-between pb-3">
              <p className="font-mono text-xs text-bone">
                {name.trim()}{" "}
                <span className="text-dust">
                  · {mode === "openapi" ? "openapi spec" : "inferred from a text document"}
                </span>
              </p>
              {!result && (
                <button
                  type="button"
                  onClick={() => { setEvaluating(false); setResult(null); }}
                  className="font-mono text-[0.65rem] uppercase tracking-wider text-ash hover:text-bone"
                >
                  ← edit
                </button>
              )}
            </div>
          )}

          {!evaluating && (
          <>
          <label className="mb-1.5 block font-mono text-[0.65rem] uppercase tracking-wider text-ash" htmlFor="sys-name">
            System name
          </label>
          <input
            id="sys-name"
            className="field"
            placeholder="e.g. Shipmate (our logistics vendor)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <p className="mb-1.5 mt-5 font-mono text-[0.65rem] uppercase tracking-wider text-ash">
            How is its API documented?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setMode("openapi"); setResult(null); setEvaluating(false); }}
              aria-pressed={mode === "openapi"}
              className={`border p-3 text-left transition-colors ${mode === "openapi" ? "border-acid bg-soot" : "border-rule hover:border-dust"}`}
            >
              <p className="font-mono text-xs text-bone">OpenAPI / Swagger</p>
              <p className="mt-1 text-[0.7rem] text-ash">A proper spec exists. Fast, exact.</p>
            </button>
            <button
              type="button"
              onClick={() => { setMode("text"); setResult(null); setEvaluating(false); }}
              aria-pressed={mode === "text"}
              className={`border p-3 text-left transition-colors ${mode === "text" ? "border-acid bg-soot" : "border-rule hover:border-dust"}`}
            >
              <p className="font-mono text-xs text-bone">Only a text document</p>
              <p className="mt-1 text-[0.7rem] text-ash">
                Notes, a wiki page, an email. Mimir reads it and infers the tools.
              </p>
            </button>
          </div>

          <div className="mt-4">
            {mode === "openapi" ? (
              <div className="space-y-2">
                <input
                  className="field font-mono"
                  placeholder="https://api.vendor.com/openapi.json"
                  value={specUrl}
                  onChange={(e) => setSpecUrl(e.target.value)}
                  aria-label="OpenAPI spec URL"
                />
                <input
                  className="field font-mono"
                  placeholder="API base URL for execution (defaults to the spec's origin)"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  aria-label="API base URL"
                />
                {engineLive && (
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-acid">
                    ● engine live — this will couple for real
                  </p>
                )}
                {authFields}
                <div className="border-t border-rule-soft pt-3">
                  <p className="mb-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ash">
                    Business context <span className="text-dust">— grounds the AI in your domain</span>
                  </p>
                  <textarea
                    className="field min-h-16 font-mono text-xs"
                    placeholder="What is this business? e.g. 'An HR system managing employees, leave, and payroll for a 200-person company.'"
                    value={bizDesc}
                    onChange={(e) => setBizDesc(e.target.value)}
                    aria-label="Business description"
                  />
                  <textarea
                    className="field mt-2 min-h-16 font-mono text-xs"
                    placeholder={"Glossary — one per line, 'term = meaning':\nrun = a delivery route\ngiveback = a refund"}
                    value={glossary}
                    onChange={(e) => setGlossary(e.target.value)}
                    aria-label="Glossary"
                  />
                  <p className="mt-1.5 font-mono text-[0.6rem] text-dust">
                    Injected into evaluation + the agent so it understands your terms (e.g. what get_user_details returns).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="field min-h-28 font-mono"
                  placeholder={"Paste whatever exists — e.g.\n“to book a shipment POST the order payload to /shipments, tracking is at /track with the ref, rates can be queried per zone…”"}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  aria-label="API notes text"
                />
                <input
                  className="field font-mono"
                  placeholder="API base URL (optional — the commissioning interview will ask if omitted)"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  aria-label="API base URL"
                />
                {engineLive && (
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-acid">
                    ● engine live — the model reads your notes, then confirms its reading with you before committing
                  </p>
                )}
                {authFields}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canEvaluate || drafting}
            onClick={startEvaluation}
            className="btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {drafting
              ? "Reading your notes…"
              : mode === "text"
                ? engineLive
                  ? "Commission this system"
                  : "Evaluate the document"
                : "Read the spec"}
          </button>
          </>
          )}

          {evaluating && <ApiEvaluation mode={mode} onDone={setResult} />}

          {result && (
            <button type="button" onClick={couple} disabled={coupling} className="btn-primary mt-4 w-full disabled:opacity-50">
              {coupling
                ? "Coupling — ingesting spec + evaluating…"
                : `Add ${name.trim() || "system"} to the deck · ${result.tools} tools`}
            </button>
          )}
          {coupleError && (
            <p role="alert" className="mt-2 font-mono text-xs text-ember">{coupleError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
