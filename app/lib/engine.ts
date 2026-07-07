/* Client for the Mimir Engine (../mimir-engine, FastAPI on :8010).
   Every call returns null on failure so the deck can fall back to demo mode
   without ceremony. */

import type { ConnectedSystem, ExecutionStep } from "./mock-data";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://127.0.0.1:8010";
const TOKEN_KEY = "mimir.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const t = getToken();
  return { ...(extra ?? {}), ...(t ? { authorization: `Bearer ${t}` } : {}) };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/** Register or log in — stores the token on success, returns the user (or an error string). */
export async function engineAuth(
  mode: "login" | "register",
  body: { email: string; password: string; name?: string }
): Promise<{ user: AuthUser } | { error: string }> {
  try {
    const res = await fetch(`${ENGINE_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.detail ?? "Authentication failed" };
    setToken(data.token);
    // replay the deck's boot-preflight sequence on this fresh login/signup
    if (typeof window !== "undefined") sessionStorage.removeItem("mimir.booted");
    return { user: data.user };
  } catch {
    return { error: "Could not reach the engine. Is it running on :8010?" };
  }
}

export async function engineMe(): Promise<AuthUser | null> {
  return get<AuthUser>("/auth/me");
}

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${ENGINE_URL}${path}`, { cache: "no-store", headers: authHeaders() });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface EngineHealth {
  engine: string;
  llm: boolean;
}

export function engineHealth(): Promise<EngineHealth | null> {
  return get<EngineHealth>("/health");
}

interface EngineSystemSummary {
  id: string;
  name: string;
  status: string;
  tool_count: number;
  latency_ms?: number | null;
}

interface EngineSystemDetail extends EngineSystemSummary {
  tools: { name: string; method: string; path: string; permission: string; purpose: string }[];
}

export async function engineSystems(): Promise<ConnectedSystem[] | null> {
  const list = await get<EngineSystemSummary[]>("/systems");
  if (!list || list.length === 0) return null;
  const detailed = await Promise.all(
    list.map((s) => get<EngineSystemDetail>(`/systems/${s.id}`))
  );
  return list.map((s, i) => ({
    id: s.id,
    name: s.name,
    kind: "Coupled system",
    status: (s.status === "online" ? "online" : "offline") as ConnectedSystem["status"],
    toolCount: s.tool_count,
    latencyMs: s.latency_ms ?? undefined,
    tools: (detailed[i]?.tools ?? []).map((t) => ({
      name: t.name,
      method: t.method as "GET" | "POST" | "PUT" | "DELETE",
      endpoint: t.path,
      description: t.purpose,
      permission: (t.permission === "approval" ? "approval" : "auto") as "auto" | "approval",
    })),
  }));
}

export interface PendingAction {
  tool: string;
  system: string;
  args: string;
}

export interface EngineRun {
  id: string;
  status: "held" | "filed" | "failed";
  summary: string;
  steps: ExecutionStep[];
  pending: PendingAction[];
}

interface RawRun {
  id: string;
  status: string;
  summary: string;
  steps: { tool: string; system: string; status: number; ms: number }[];
  pending?: { tool: string; system: string; args: string }[];
}

function mapRun(run: RawRun): EngineRun {
  return {
    id: run.id,
    status: (run.status === "held" ? "held" : run.status === "failed" ? "failed" : "filed") as EngineRun["status"],
    summary: run.summary,
    steps: (run.steps ?? []).map((s) => ({
      tool: s.tool,
      system: s.system,
      detail: `→ HTTP ${s.status}`,
      durationMs: s.ms,
      status: "done" as const,
    })),
    pending: run.pending ?? [],
  };
}

async function post(path: string, body?: unknown): Promise<EngineRun | null> {
  try {
    const res = await fetch(`${ENGINE_URL}${path}`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return mapRun((await res.json()) as RawRun);
  } catch {
    return null;
  }
}

export function engineRunIntent(text: string): Promise<EngineRun | null> {
  return post("/intents", { text });
}

/** Human verdict on a held run — resumes the agent loop server-side. */
export function engineResolve(runId: string, approved: boolean): Promise<EngineRun | null> {
  return post(`/runs/${runId}/${approved ? "approve" : "deny"}`);
}

/** Couple a new system for real: the engine ingests the spec, machines the
    tools, and runs the capability evaluation. */
export interface CoupleAuth {
  type: "none" | "bearer" | "api_key" | "basic";
  token?: string;
  header?: string;
  value?: string;
  username?: string;
  password?: string;
}

export interface BusinessContext {
  description?: string;
  glossary?: Record<string, string>;
}

export async function engineCoupleSystem(
  name: string,
  // documented API → specUrl; undocumented API → doc (pasted human-written docs)
  source: { specUrl?: string; doc?: string },
  baseUrl: string,
  auth?: CoupleAuth,
  context?: BusinessContext
): Promise<{ id: string; name: string; tool_count: number } | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/systems`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({
        name,
        base_url: baseUrl,
        spec_url: source.specUrl,
        doc: source.doc,
        auth,
        context,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string; name: string; tool_count: number };
  } catch {
    return null;
  }
}

// ── Commissioning: verify-before-commit onboarding ──────────────────────────
export interface DraftGap {
  id: string;
  kind: string;
  question: string;
  tool?: string;
}

export interface DraftTool {
  name: string;
  method: string;
  path: string;
  description?: string;
  parameters?: unknown;
  permission: string;
}

export interface DraftCapabilities {
  system_purpose?: string;
  tools?: Record<string, string>;
  joint_capabilities?: string[];
  risks?: string[];
  evaluated_by?: string;
}

export interface DraftInterpretation {
  name: string;
  title?: string;
  base_url: string;
  tools: DraftTool[];
  capabilities: DraftCapabilities;
  context?: BusinessContext;
  gaps: DraftGap[];
}

/** Step 1 — infer an interpretation + its open questions. Nothing is persisted. */
export async function engineDraftSystem(
  name: string,
  source: { specUrl?: string; doc?: string },
  baseUrl?: string,
  context?: BusinessContext
): Promise<DraftInterpretation | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/systems/draft`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ name, base_url: baseUrl, spec_url: source.specUrl, doc: source.doc, context }),
    });
    if (!res.ok) return null;
    return (await res.json()) as DraftInterpretation;
  } catch {
    return null;
  }
}

/** Step 2 — one confirmation turn: operator message → reply + refined draft. */
export async function engineClarifyDraft(
  interpretation: DraftInterpretation,
  message: string,
  history: { role: string; content: string }[]
): Promise<{ reply: string; interpretation: DraftInterpretation; gaps: DraftGap[] } | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/systems/clarify`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ interpretation, message, history }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { reply: string; interpretation: DraftInterpretation; gaps: DraftGap[] };
  } catch {
    return null;
  }
}

/** Step 3 — the gate: persist the operator-confirmed interpretation. */
export async function engineCommitSystem(
  name: string,
  interpretation: DraftInterpretation,
  auth?: CoupleAuth
): Promise<{ id: string; name: string; tool_count: number } | null> {
  try {
    const res = await fetch(`${ENGINE_URL}/systems/commit`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ name, interpretation, auth }),
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string; name: string; tool_count: number };
  } catch {
    return null;
  }
}

export interface EngineActivity {
  time: string;
  intent: string;
  tools: number;
  systems: string[];
  status: "filed" | "held";
  operator: string;
}

export async function engineRuns(): Promise<EngineActivity[] | null> {
  const runs = await get<
    { intent: string; status: string; steps: { system: string }[]; created_at: string; operator: string }[]
  >("/runs");
  if (!runs) return null;
  return runs.map((r) => ({
    time: new Date(r.created_at).toTimeString().slice(0, 5),
    intent: r.intent,
    tools: r.steps?.length ?? 0,
    systems: [...new Set((r.steps ?? []).map((st) => st.system))],
    status: r.status === "held" ? "held" : "filed",
    operator: r.operator || "operator",
  }));
}

export function engineMemories(): Promise<{ content: string; at: string }[] | null> {
  return get<{ content: string; at: string }[]>("/memories");
}

/* ── Live streaming (SSE over fetch) ─────────────────────────────────── */

export interface StreamHandlers {
  onThinking?: () => void;
  onExecuting?: (tool: string, system: string) => void;
  onStep?: (step: ExecutionStep) => void;
  onHeld?: (runId: string, pending: PendingAction[]) => void;
  onFiled?: (summary: string) => void;
  onFailed?: (summary: string) => void;
  onSession?: (sessionId: string) => void;
  onReplyStart?: () => void;
  onToken?: (delta: string) => void;
  onReplyEnd?: () => void;
}

/** Stream a run's events as they happen server-side. Returns false if the
    stream could not start (caller should fall back to the blocking call). */
async function consumeStream(path: string, body: unknown | undefined, h: StreamHandlers): Promise<boolean> {
  let res: Response;
  try {
    res = await fetch(`${ENGINE_URL}${path}`, {
      method: "POST",
      headers: authHeaders({ "content-type": "application/json" }),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return false;
  }
  if (!res.ok || !res.body) return false;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const ev = JSON.parse(line.slice(6)) as {
        type: string;
        tool?: string;
        system?: string;
        step?: { tool: string; system: string; status: number; ms: number };
        run_id?: string;
        pending?: PendingAction[];
        summary?: string;
        text?: string;
        id?: string;
      };
      if (ev.type === "session") h.onSession?.(ev.id ?? "");
      if (ev.type === "thinking") h.onThinking?.();
      if (ev.type === "reply_start") h.onReplyStart?.();
      if (ev.type === "token") h.onToken?.(ev.text ?? "");
      if (ev.type === "reply_end") h.onReplyEnd?.();
      if (ev.type === "executing") h.onExecuting?.(ev.tool!, ev.system!);
      if (ev.type === "step" && ev.step)
        h.onStep?.({
          tool: ev.step.tool,
          system: ev.step.system,
          detail: `→ HTTP ${ev.step.status}`,
          durationMs: ev.step.ms,
          status: "done",
        });
      if (ev.type === "held") h.onHeld?.(ev.run_id!, ev.pending ?? []);
      if (ev.type === "filed") h.onFiled?.(ev.summary ?? "Run filed.");
      if (ev.type === "failed") h.onFailed?.(ev.summary ?? "Run failed.");
    }
  }
  return true;
}

export function engineStreamIntent(text: string, h: StreamHandlers): Promise<boolean> {
  return consumeStream("/intents/stream", { text }, h);
}

/** One conversational turn — the session is the persistent brain. */
export function engineChat(text: string, sessionId: string | null, h: StreamHandlers): Promise<boolean> {
  return consumeStream("/chat/stream", { text, session_id: sessionId }, h);
}

export function engineStreamResolve(runId: string, approved: boolean, h: StreamHandlers): Promise<boolean> {
  return consumeStream(`/runs/${runId}/resolve/stream?approved=${approved}`, undefined, h);
}
