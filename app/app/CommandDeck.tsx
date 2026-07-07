"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import BootCheck from "./BootCheck";
import TourGuide, { startTour } from "./TourGuide";
import MonitorPanel from "./MonitorPanel";
import MarkdownMessage from "./MarkdownMessage";
import AddSystemPanel from "./AddSystemPanel";
import { engineHealth, engineSystems, engineRunIntent, engineResolve, engineChat, engineStreamResolve, engineRuns, engineMemories, engineMe, getToken, clearToken, type AuthUser, type EngineActivity, type EngineHealth, type EngineRun, type PendingAction, type StreamHandlers } from "../lib/engine";
import {
  SYSTEMS,
  DEMO_EXECUTION,
  SAMPLE_INTENTS,
  type ConnectedSystem,
  type ExecutionStep,
  type ActivityEntry,
} from "../lib/mock-data";

gsap.registerPlugin(useGSAP);

/* The Command Deck, canvas edition (React Flow).
   Calm: one intent line. Canvas: systems as live nodes — wired to the core
   and to each other when unconfined; a node's border runs marching-ants
   while it executes. The intent bar stays docked in the canvas, so the next
   command runs from right here — no bouncing back to the calm screen. */

type RunState = "idle" | "running" | "held" | "filed";
type NodeState = "idle" | "running" | "done";

/* ── Custom nodes ── */

function SystemNode({ data }: NodeProps) {
  const d = data as {
    name: string;
    kind: string;
    toolCount: number;
    state: NodeState;
    activeTool: string | null;
    doneTools: string[];
  };
  const border =
    d.state === "running" ? "border-transparent" : d.state === "done" ? "border-acid" : "border-rule";

  return (
    <div className={`relative w-52 border bg-soot transition-colors duration-300 ${border}`}>
      {/* marching ants while executing */}
      {d.state === "running" && (
        <svg className="pointer-events-none absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)]" aria-hidden>
          <rect
            className="ants-rect"
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            fill="none"
            stroke="var(--acid)"
            strokeWidth="2"
            strokeDasharray="8 4"
          />
        </svg>
      )}
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-dust" />
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-dust" />
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="display text-base">{d.name}</p>
        <span
          className={`h-2 w-2 ${
            d.state === "running" ? "animate-pulse bg-acid" : d.state === "done" ? "bg-acid" : "bg-dust"
          }`}
          aria-hidden
        />
      </div>
      <p className="px-4 pt-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-ash">
        {d.kind} · {d.toolCount} tools
      </p>
      <div className="mt-2 border-t border-rule-soft px-4 py-2 font-mono text-[0.65rem]">
        {d.state === "running" && d.activeTool ? (
          <span className="text-acid">▸ {d.activeTool}() executing…</span>
        ) : d.doneTools.length ? (
          <span className="text-ash">✓ {d.doneTools.join("(), ")}()</span>
        ) : (
          <span className="text-dust">standing by</span>
        )}
      </div>
    </div>
  );
}

function CoreNode({ data }: NodeProps) {
  const d = data as { intent: string; runState: RunState };
  return (
    <div
      className={`w-56 border-2 bg-carbon px-4 py-3 ${
        d.runState === "running" ? "border-acid" : "border-bone"
      }`}
    >
      <Handle type="source" position={Position.Right} className="!h-1.5 !w-1.5 !border-0 !bg-dust" />
      <Handle type="target" position={Position.Left} className="!h-1.5 !w-1.5 !border-0 !bg-dust" />
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-dust">Mimir core</p>
      <p className="mt-1 line-clamp-2 font-mono text-[0.7rem] text-bone">
        <span className="text-acid">❯</span> {d.intent || "awaiting intent"}
      </p>
      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-wider text-ash">
        {d.runState === "running" ? "routing…" : d.runState === "filed" ? "record filed ✓" : "idle"}
      </p>
    </div>
  );
}

const nodeTypes = { system: SystemNode, core: CoreNode };

const POSITIONS: Record<string, { x: number; y: number }> = {
  core: { x: 40, y: 180 },
  stripe: { x: 420, y: 20 },
  shopify: { x: 480, y: 190 },
  zendesk: { x: 420, y: 360 },
};

/* The conversation's own scrollbar: a punch-tape — perforation dots down the
   edge, a draggable acid read-head, and a "▼ latest" jump pill when you've
   scrolled up into history. Distinct from the landing gauge and monitor meter. */
function FeedTape({ target }: { target: React.RefObject<HTMLDivElement | null> }) {
  const [geom, setGeom] = useState({ visible: false, top: 0, height: 0, atBottom: true });
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      const visible = max > 12;
      const frac = el.clientHeight / el.scrollHeight;
      const h = Math.max(28, frac * el.clientHeight);
      const top = max > 0 ? (el.scrollTop / max) * (el.clientHeight - h) : 0;
      setGeom({ visible, top, height: h, atBottom: max - el.scrollTop < 24 });
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

  const scrub = (clientY: number) => {
    const el = target.current;
    const tr = track.current;
    if (!el || !tr) return;
    const r = tr.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    el.scrollTop = p * (el.scrollHeight - el.clientHeight);
  };

  if (!geom.visible) return null;
  return (
    <>
      <div
        ref={track}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          scrub(e.clientY);
        }}
        onPointerMove={(e) => dragging.current && scrub(e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        className="absolute bottom-2 right-1 top-2 z-10 w-3 cursor-pointer"
        aria-hidden
      >
        {/* perforations */}
        <div
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, var(--rule) 0 2px, transparent 2px 8px)",
          }}
        />
        {/* read-head */}
        <div
          className={`absolute left-0 w-full border transition-colors ${geom.atBottom ? "border-acid/70 bg-acid/20" : "border-acid bg-acid/40"}`}
          style={{ top: geom.top, height: geom.height }}
        >
          <span className="absolute left-1/2 top-1/2 h-0.5 w-1.5 -translate-x-1/2 -translate-y-1/2 bg-acid" />
        </div>
      </div>
      {!geom.atBottom && (
        <button
          type="button"
          onClick={() => {
            const el = target.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-acid bg-carbon px-3 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-acid transition-colors hover:bg-acid hover:text-carbon"
        >
          ▼ latest
        </button>
      )}
    </>
  );
}

/* ── Deck ── */

export default function CommandDeck() {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"calm" | "canvas">("calm");
  const [runState, setRunState] = useState<RunState>("idle");
  const [intent, setIntent] = useState("");
  const [ranIntent, setRanIntent] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<ExecutionStep[]>([]);
  const [runningStep, setRunningStep] = useState<ExecutionStep | null>(null);
  const [tab, setTab] = useState<"deck" | "monitor">("deck");
  const [booted, setBooted] = useState(false);
  const [sessionRuns, setSessionRuns] = useState<ActivityEntry[]>([]);
  const [added, setAdded] = useState<ConnectedSystem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [live, setLive] = useState<EngineHealth | null>(null);
  const [held, setHeld] = useState<{ id: string; pending: PendingAction[] } | null>(null);
  const [feed, setFeed] = useState<{ role: "op" | "mimir"; text: string }[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const streamRef = useRef("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const shownRef = useRef(0);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [liveSystems, setLiveSystems] = useState<ConnectedSystem[] | null>(null);
  const [runSummary, setRunSummary] = useState(DEMO_EXECUTION.summary);
  const [operator, setOperator] = useState<AuthUser | null>(null);
  const router = useRouter();
  const [monitorActivity, setMonitorActivity] = useState<EngineActivity[] | null>(null);
  const [monitorMemories, setMonitorMemories] = useState<{ content: string; at: string }[] | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setSessionId(sessionStorage.getItem("mimir.session"));
    (async () => {
      const me = await engineMe();
      if (!me) {
        clearToken();
        router.replace("/login");
        return;
      }
      setOperator(me);
      const [h, sys] = await Promise.all([engineHealth(), engineSystems()]);
      setLive(h);
      setLiveSystems(sys);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the newest line in view — but never yank the operator away from
  // history they deliberately scrolled up to (classic chat behavior)
  const atBottomRef = useRef(true);
  useEffect(() => {
    const el = receiptRef.current;
    if (!el) return;
    const track = () => {
      atBottomRef.current = el.scrollHeight - el.clientHeight - el.scrollTop < 40;
    };
    el.addEventListener("scroll", track, { passive: true });
    return () => el.removeEventListener("scroll", track);
  }, [view, tab]);
  useEffect(() => {
    const el = receiptRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [visibleSteps, runningStep, runState, feed, streaming]);

  // Monitor tab pulls real records whenever it opens
  useEffect(() => {
    if (tab !== "monitor" || !live) return;
    (async () => {
      const [runs, mems] = await Promise.all([engineRuns(), engineMemories()]);
      setMonitorActivity(runs);
      setMonitorMemories(mems);
    })();
  }, [tab, live]);

  const allSystems = useMemo(
    () => [...(liveSystems ?? SYSTEMS), ...added],
    [added, liveSystems]
  );
  const focused = useMemo(() => allSystems.find((s) => s.id === focus) ?? null, [focus, allSystems]);
  const deckSystems = focused ? [focused] : allSystems;
  const steps = useMemo(
    () => (focused ? DEMO_EXECUTION.steps.filter((st) => st.system === focused.name) : DEMO_EXECUTION.steps),
    [focused]
  );

  const { contextSafe } = useGSAP({ scope: root });

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /* Run from anywhere — calm screen or docked bar. Resets the previous
     record and executes in place. */
  const finishRun = (seq: ExecutionStep[], text: string, summary: string) => {
    seq.forEach((st, i) => {
      timers.current.push(setTimeout(() => setRunningStep(st), 300 + i * 900));
      timers.current.push(
        setTimeout(() => {
          setVisibleSteps((v) => [...v, st]);
          setRunningStep(null);
        }, 300 + i * 900 + 700)
      );
    });
    timers.current.push(
      setTimeout(() => {
        setRunState("filed");
        setRunSummary(summary);
        setSessionRuns((r) => [
          {
            time: new Date().toTimeString().slice(0, 5),
            intent: text,
            tools: seq.length,
            systems: [...new Set(seq.map((st) => st.system))],
            operator: operator?.email ?? "operator",
            status: "filed",
          },
          ...r,
        ]);
      }, 300 + seq.length * 900 + 300)
    );
  };

  /* Live handlers: the canvas reacts the moment the engine emits. */
  const makeStreamHandlers = (text: string): StreamHandlers => ({
    onThinking: () => setRunningStep(null),
    onExecuting: (tool, system) =>
      setRunningStep({ tool, system, detail: "executing…", durationMs: 0, status: "running" }),
    onStep: (st) => {
      setVisibleSteps((v) => [...v, st]);
      shownRef.current += 1;
      // real calls finish in ~30ms — keep the flash visible for a beat
      timers.current.push(setTimeout(() => setRunningStep(null), 400));
    },
    onHeld: (runId, pending) => {
      setRunningStep(null);
      setHeld({ id: runId, pending });
      setRunState("held");
    },
    onSession: (id) => {
      setSessionId(id);
      sessionStorage.setItem("mimir.session", id);
    },
    onReplyStart: () => {
      streamRef.current = "";
      setStreaming("");
    },
    onToken: (delta) => {
      streamRef.current += delta;
      setStreaming(streamRef.current);
    },
    onReplyEnd: () => {
      // commit the streamed text as a permanent feed message
      const finalText = streamRef.current;
      if (finalText) setFeed((f) => [...f, { role: "mimir", text: finalText }]);
      setStreaming(null);
      streamRef.current = "";
    },
    onFiled: (summary) => {
      setRunningStep(null);
      setRunState("filed");
      setRunSummary(summary);
      // safe-refusal / non-streamed replies never sent tokens — show them now
      if (summary && streamRef.current === "" && streaming === null) {
        setFeed((f) => (f.at(-1)?.text === summary ? f : [...f, { role: "mimir", text: summary }]));
      }
      setSessionRuns((prev) => [
        {
          time: new Date().toTimeString().slice(0, 5),
          intent: text,
          tools: shownRef.current,
          systems: [...new Set(allSystems.map((sys) => sys.name))].slice(0, 1),
          operator: operator?.email ?? "operator",
          status: "filed",
        },
        ...prev,
      ]);
    },
    onFailed: (summary) => {
      setRunningStep(null);
      setRunState("filed");
      setRunSummary(summary);
    },
  });

  /* Animate whatever steps the engine returned since last render, then land
     in held (awaiting a human) or filed. (Fallback for non-streaming.) */
  const applyEngine = (r: EngineRun, text: string) => {
    const fresh = r.steps.slice(shownRef.current);
    shownRef.current = r.steps.length;
    fresh.forEach((st, i) => {
      timers.current.push(setTimeout(() => setRunningStep(st), 300 + i * 700));
      timers.current.push(
        setTimeout(() => {
          setVisibleSteps((v) => [...v, st]);
          setRunningStep(null);
        }, 300 + i * 700 + 550)
      );
    });
    const settle = 300 + fresh.length * 700 + 200;
    timers.current.push(
      setTimeout(() => {
        if (r.status === "held") {
          setHeld({ id: r.id, pending: r.pending });
          setRunState("held");
        } else {
          setRunState("filed");
          setRunSummary(r.summary || (r.status === "failed" ? "Run failed." : "Run filed."));
          setSessionRuns((prev) => [
            {
              time: new Date().toTimeString().slice(0, 5),
              intent: text,
              tools: r.steps.length,
              systems: [...new Set(r.steps.map((st) => st.system))],
              operator: operator?.email ?? "operator",
              status: r.status === "failed" ? "held" : "filed",
            },
            ...prev,
          ]);
        }
      }, settle)
    );
  };

  const resolveHeld = contextSafe(async (approved: boolean) => {
    if (!held) return;
    const id = held.id;
    setHeld(null);
    setRunState("running");
    const streamed = await engineStreamResolve(id, approved, makeStreamHandlers(ranIntent));
    if (streamed) return;
    const r = await engineResolve(id, approved);
    if (r) applyEngine(r, ranIntent);
    else {
      setRunState("filed");
      setRunSummary("Engine unreachable while resolving the approval.");
    }
  });

  const run = contextSafe(async (raw?: string) => {
    if (runState === "running") return;
    const text = (raw ?? intent).trim() || DEMO_EXECUTION.intent;
    clearTimers();
    setRanIntent(text);
    setIntent("");
    setVisibleSteps([]);
    setRunningStep(null);
    setHeld(null);
    setStreaming(null);
    streamRef.current = "";
    shownRef.current = 0;
    setRunState("running");
    if (view === "calm") setView("canvas");

    // Real engine first: stream events live; fall back to the blocking call.
    // Health can go stale (model warms/cools) — re-probe when it looked down.
    let health = live;
    if (!health?.llm) {
      health = await engineHealth();
      setLive(health);
    }
    if (health?.llm) {
      setFeed((f) => [...f, { role: "op", text }]);
      const scoped = focused ? `Only use ${focused.name} tools. ${text}` : text;
      const streamed = await engineChat(scoped, sessionId, makeStreamHandlers(text));
      if (streamed) return;
      const result = await engineRunIntent(scoped);
      if (result) {
        applyEngine(result, text);
        return;
      }
    }

    // Scripted demo fallback (engine or model offline).
    const seq = steps.length ? steps : DEMO_EXECUTION.steps.slice(0, 1);
    finishRun(seq, text, DEMO_EXECUTION.summary);
  });

  const backToDeck = contextSafe(() => {
    clearTimers();
    setView("calm");
    setRunState("idle");
    setVisibleSteps([]);
    setRunningStep(null);
    gsap.fromTo("[data-calm]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
  });

  /* Canvas graph */
  const nodeStateFor = (name: string): NodeState => {
    if (runningStep?.system === name) return "running";
    if (visibleSteps.some((st) => st.system === name)) return "done";
    return "idle";
  };

  const nodes: Node[] = useMemo(
    () => [
      {
        id: "core",
        type: "core",
        position: POSITIONS.core,
        data: { intent: ranIntent, runState },
      },
      ...deckSystems.map((s) => ({
        id: s.id,
        type: "system",
        position: focused ? { x: 440, y: 180 } : POSITIONS[s.id] ?? { x: 460, y: 360 + 150 * added.findIndex((a) => a.id === s.id) },
        data: {
          name: s.name,
          kind: s.kind,
          toolCount: s.toolCount,
          state: nodeStateFor(s.name),
          activeTool: runningStep?.system === s.name ? runningStep.tool : null,
          doneTools: visibleSteps.filter((st) => st.system === s.name).map((st) => st.tool),
        },
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deckSystems, focused, ranIntent, runState, runningStep, visibleSteps]
  );

  const edges: Edge[] = useMemo(() => {
    const sysByName = (n: string) => allSystems.find((s) => s.name === n)?.id;
    const list: Edge[] = deckSystems.map((s) => {
      const active = runningStep?.system === s.name;
      return {
        id: `core-${s.id}`,
        source: "core",
        target: s.id,
        animated: active,
        style: {
          stroke: active ? "var(--acid)" : "var(--rule)",
          strokeWidth: active ? 2 : 1,
        },
      };
    });
    /* Unconfined: systems interact with each other — the run's hand-offs
       are drawn system→system and light up as data actually flows. */
    if (!focused) {
      for (let i = 0; i < steps.length - 1; i++) {
        const a = sysByName(steps[i].system);
        const b = sysByName(steps[i + 1].system);
        if (!a || !b || a === b) continue;
        const done = visibleSteps.length > i + 1 || (visibleSteps.length > i && !!runningStep);
        const flowing = visibleSteps.length === i + 1 && !!runningStep;
        list.push({
          id: `flow-${i}-${a}-${b}`,
          source: a,
          target: b,
          animated: flowing || runState === "running",
          label: flowing ? "handing off…" : undefined,
          style: {
            stroke: flowing ? "var(--acid)" : done ? "var(--acid-dim)" : "var(--rule)",
            strokeWidth: flowing ? 2 : 1,
            strokeDasharray: done || flowing ? undefined : "4 4",
          },
          labelStyle: { fill: "var(--acid)", fontFamily: "monospace", fontSize: 9 },
          labelBgStyle: { fill: "var(--carbon)" },
        });
      }
    }
    return list;
  }, [deckSystems, focused, steps, visibleSteps, runningStep, runState, allSystems]);

  return (
    <div ref={root} className="flex h-screen flex-col overflow-hidden bg-carbon">
      {/* Deck header */}
      <header className="rule-b flex items-stretch justify-between">
        <div className="flex items-stretch">
          <Link href="/" className="flex items-center gap-3 px-3 py-3.5 sm:px-5">
            <span aria-hidden className="h-3 w-3 bg-acid" />
            <span className="display text-sm">MIMIR DECK</span>
          </Link>
          {/* Tabs */}
          <div data-tour="tabs" className="flex items-stretch font-mono text-[0.65rem] uppercase tracking-[0.12em]">
            {(["deck", "monitor"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`border-l border-rule px-3 transition-colors sm:px-5 ${
                  tab === t ? "bg-soot text-acid" : "text-ash hover:bg-soot hover:text-bone"
                }`}
              >
                {t === "deck" ? "Deck" : "Monitor"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 items-stretch overflow-x-auto font-mono text-[0.65rem] uppercase tracking-[0.12em] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => startTour(setTab)}
            title="Replay the walkthrough"
            className="flex items-center border-l border-rule px-3 text-ash transition-colors hover:bg-soot hover:text-acid sm:px-4"
          >
            ?
          </button>
          {focused && (
            <button
              type="button"
              onClick={() => setFocus(null)}
              className="flex items-center gap-2 border-l border-rule bg-acid px-4 text-carbon"
            >
              Focus: {focused.name} · {focused.toolCount} tools — release ✕
            </button>
          )}
          <span data-tour="status" className="hidden items-center gap-2 border-l border-rule px-4 text-ash sm:flex">
            <span className={`h-1.5 w-1.5 animate-pulse ${live?.llm ? "bg-acid" : "bg-ember"}`} aria-hidden />
            {allSystems.length} systems · {live?.llm ? "engine live" : live ? "engine up · no model" : "demo mode"}
          </span>
          <span className="hidden items-center border-l border-rule px-4 text-ash md:flex">{operator?.name || operator?.email || "operator"}</span>
          <button
            type="button"
            data-tour="logout"
            title="Seal the session and log out"
            onClick={() => { clearToken(); sessionStorage.removeItem("mimir.session"); router.push("/logout"); }}
            className="flex shrink-0 items-center whitespace-nowrap border-l border-rule px-3 text-ash transition-colors hover:bg-ember hover:text-carbon sm:px-4"
          >
            ⏻ <span className="ml-1 hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      {focused && (
        <p className="rule-b bg-soot px-5 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ash">
          Confined mode — the operator can only execute {focused.name} tools. Inter-system
          hand-offs are disabled by the runtime.
        </p>
      )}

      <BootCheck onDone={() => setBooted(true)} />
      {showAdd && (
        <AddSystemPanel
          engineLive={!!live}
          onAdd={(s) => setAdded((a) => [...a, s])}
          onCoupled={async () => setLiveSystems(await engineSystems())}
          onClose={() => setShowAdd(false)}
        />
      )}
      <TourGuide ready={booted && tab === "deck" && view === "calm"} setTab={setTab} />

      {/* ── Monitor tab ── */}
      {tab === "monitor" && <MonitorPanel sessionRuns={sessionRuns} systems={allSystems} realActivity={monitorActivity} memories={monitorMemories} />}

      {/* ── Calm ── */}
      {tab === "deck" && view === "calm" && (
        <main data-calm className="flex flex-1 flex-col items-center justify-center px-6">
          <p className="engrave">{focused ? `Operating ${focused.name} only` : "Operating all systems"}</p>
          <h1 className="display mt-4 text-center text-4xl sm:text-6xl">
            State your intent<span className="text-acid">.</span>
          </h1>
          <form
            data-tour="intent"
            className="mt-10 w-full max-w-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <div className="flex items-center gap-3 border-b-2 border-bone pb-3 focus-within:border-acid">
              <span className="font-mono text-acid">❯</span>
              <input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder={focused ? `e.g. refund the failed ${focused.name} payments` : DEMO_EXECUTION.intent}
                className="w-full bg-transparent font-mono text-sm text-bone outline-none placeholder:text-dust sm:text-base"
                aria-label="Intent"
              />
              <button type="submit" className="btn-primary !px-4 !py-2">Run</button>
            </div>
          </form>
          <ul data-tour="samples" className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
            {SAMPLE_INTENTS.slice(0, 3).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setIntent(s)}
                  className="border border-rule px-3 py-1.5 font-mono text-[0.7rem] text-ash transition-colors hover:border-acid hover:text-bone"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </main>
      )}

      {/* ── Canvas ── */}
      {tab === "deck" && view === "canvas" && (
        <main className="flex min-h-0 flex-1 flex-col">
          {/* Docked intent bar: the next command runs from HERE. */}
          <form
            className="rule-b flex items-center gap-3 bg-soot px-5 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
          >
            <button
              type="button"
              onClick={backToDeck}
              className="shrink-0 border border-rule px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-ash transition-colors hover:border-bone hover:text-bone"
            >
              ← Deck
            </button>
            <span className="font-mono text-acid">❯</span>
            <input
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder={
                runState === "running"
                  ? "executing — the line is busy…"
                  : "reply to Mimir or state the next intent…"
              }
              disabled={runState === "running" || runState === "held"}
              className="w-full bg-transparent font-mono text-sm text-bone outline-none placeholder:text-dust disabled:opacity-50"
              aria-label="Next intent"
            />
            <button type="submit" disabled={runState === "running"} className="btn-primary !px-4 !py-1.5 disabled:cursor-not-allowed disabled:opacity-40">
              {runState === "running" ? "Running…" : "Run"}
            </button>
          </form>

          <div className="grid min-h-0 flex-1 grid-rows-[minmax(260px,42%)_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[1.25fr_1fr]">
            {/* The canvas */}
            <section className="relative min-h-[420px] lg:border-r lg:border-rule">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                proOptions={{ hideAttribution: false }}
                zoomOnScroll={false}
                panOnScroll={false}
                nodesConnectable={false}
                deleteKeyCode={null}
                colorMode="dark"
                className="!bg-transparent"
              >
                <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(232,228,216,0.12)" />
              </ReactFlow>
              <p className="pointer-events-none absolute bottom-3 left-4 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-dust">
                {focused ? "confined canvas — one system wired" : "live canvas — drag nodes · hand-offs light up as data flows"}
              </p>
            </section>

            {/* The receipt */}
            <section className="relative flex min-h-0 flex-col bg-soot p-5">
              <FeedTape target={receiptRef} />
              <div className="flex items-center justify-between">
                <p className="engrave">Conversation · {sessionId ? `session ${sessionId.slice(0, 6)}` : "new session"}</p>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem("mimir.session");
                    setSessionId(null);
                    setFeed([]);
                    setVisibleSteps([]);
                    setRunSummary("");
                  }}
                  className="font-mono text-[0.6rem] uppercase tracking-wider text-dust transition-colors hover:text-acid"
                >
                  ⟳ new session
                </button>
              </div>
              <div
                ref={receiptRef}
                data-lenis-prevent
                className="mt-3 min-h-0 flex-1 overflow-y-auto font-mono text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {feed.map((m, i) => (
                  <div key={i} className={`py-2 ${m.role === "mimir" ? "border-l-2 border-acid pl-3" : ""}`}>
                    {m.role === "op" ? (
                      <p className="text-bone"><span className="text-acid">❯</span> {m.text}</p>
                    ) : (
                      <MarkdownMessage text={m.text} />
                    )}
                  </div>
                ))}
                {streaming !== null && (
                  <div className="border-l-2 border-acid py-2 pl-3">
                    <MarkdownMessage text={streaming} />
                    <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-acid align-middle" aria-hidden />
                  </div>
                )}
                {visibleSteps.map((s, i) => (
                  <div
                    key={s.tool + i}
                    className="rule-b grid grid-cols-[2rem_1fr_auto] items-baseline gap-2 py-2.5 first:border-t first:border-rule sm:grid-cols-[2.5rem_minmax(0,1.4fr)_minmax(4.5rem,1fr)_auto]"
                  >
                    <span className="text-dust">{String(i + 1).padStart(2, "0")}</span>
                    <span className="truncate text-bone" title={`${s.tool}()`}>{s.tool}()</span>
                    <span className="truncate text-ash" title={s.detail}>{s.detail}</span>
                    <span className="whitespace-nowrap text-acid">✓ {s.durationMs}ms</span>
                  </div>
                ))}
                {runningStep && (
                  <p className="animate-pulse py-2.5 text-acid">
                    ▸ {runningStep.tool}() on {runningStep.system}…
                  </p>
                )}
                {runState === "running" && !runningStep && (
                  <p className="animate-pulse py-2.5 text-dust">▚ core reasoning…</p>
                )}
              </div>
              {runState === "held" && held && (
                <div className="mt-3 border border-ember/60 bg-ember/[0.06] p-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ember">
                    ⚠ Held — operator approval required
                  </p>
                  <ul className="mt-3 space-y-1.5 font-mono text-xs">
                    {held.pending.map((pa, i) => (
                      <li key={i} className="text-bone">
                        {pa.tool}(<span className="text-ash">{pa.args.slice(1, -1)}</span>)
                        <span className="text-dust"> · {pa.system}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-3">
                    <button type="button" onClick={() => resolveHeld(true)} className="btn-primary !px-4 !py-2 !text-[0.65rem]">
                      Approve · run it
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveHeld(false)}
                      className="border border-ember px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wider text-ember transition-colors hover:bg-ember hover:text-carbon"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              )}
              {runState === "filed" && (
                <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-wider text-dust">
                  Record filed ✓ — reply above to continue the conversation
                </p>
              )}
            </section>
          </div>
        </main>
      )}

      {/* Systems strip */}
      <footer data-tour="systems" className="rule-t flex items-stretch overflow-x-auto">
        <span className="flex shrink-0 items-center px-4 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-dust">
          Systems
        </span>
        {allSystems.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFocus(focus === s.id ? null : s.id)}
            aria-pressed={focus === s.id}
            className={`flex shrink-0 items-center gap-2 border-l border-rule px-5 py-3 font-mono text-[0.7rem] uppercase tracking-wider transition-colors ${
              focus === s.id ? "bg-acid text-carbon" : "text-ash hover:bg-soot hover:text-bone"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 ${s.status === "online" ? "bg-acid" : "bg-ember"} ${focus === s.id ? "!bg-carbon" : ""}`}
              aria-hidden
            />
            {s.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex shrink-0 items-center gap-2 border-l border-rule px-5 py-3 font-mono text-[0.7rem] uppercase tracking-wider text-dust transition-colors hover:bg-acid hover:text-carbon"
        >
          + couple a system
        </button>
      </footer>
    </div>
  );
}
