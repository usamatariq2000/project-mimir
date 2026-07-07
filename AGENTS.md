<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Scope Summary

<!-- Kept in sync with PROJECT_SCOPE.md by the scope-sync Stop hook and /init. Read PROJECT_SCOPE.md before feature work. -->

**Project Mimir — AI-Operable Software Platform.** An AI execution layer that converts any
software (existing APIs or new builds) into a set of safe, logged, permission-controlled AI
tools (`GET /orders` → `get_orders()`), so AI agents can operate business systems directly.
Full idea, architecture (Integration Layer, Tool Generator, Tool Registry, Auth Manager, Agent
Runtime, Execution Engine, Knowledge Layer, Audit System), and phase plan: see `PROJECT_SCOPE.md`.

- **Current phase:** Phase 1 MVP — OpenAPI ingestion, tool generator, agent runtime, execution
  engine, chat interface, logging.
- **Out of scope (do NOT build):** marketplace, UI builder, multi-agent systems, full database generator.
- **Status:** front-end shell complete (landing, auth, onboarding, Command Deck app view) on
  mock data. Design system v3 "Operations Ledger" — carbon/bone/acid, Archivo Black display,
  flat brutalist rules; NO blue/purple, NO glass/glow/gradient-text slop.
- **Backend:** lives in the SEPARATE `../mimir-engine` repo (Python/FastAPI, LiteLLM→Ollama
  qwen2.5:7b, Postgres JSONB, sample Acme Commerce API). WIRED AND LIVE: the deck talks to
  the engine at http://127.0.0.1:8010 via `app/lib/engine.ts` (auto-detect, demo fallback);
  a real agent run has executed real refunds end-to-end. Auth is REAL now: engine issues JWTs
  (argon2-hashed passwords), every operational endpoint requires a token, the operator is
  stamped on runs+audit; the deck's login/signup call the engine, store the token, gate the
  deck. Read `../mimir-engine/AGENTS.md` before touching backend code — run book, invariants,
  machine gotchas — including its **RULE 0 "AI Systems Engineering Doctrine"** (12 principles;
  small-model-first, code-enforces-not-prompts, eval-driven, structured-over-parsed, …) that
  all engine/agent work is held to. This is a deliberately-engineered AI system, not a wrapper.
- Any code change that alters this scope must update `PROJECT_SCOPE.md` and this summary in the same turn.

# Rule 0 — Libraries first, always

Before building ANY feature or UI component yourself, search for an existing library or
component registry that already provides it (npm, shadcn registries, Magic UI, Aceternity,
21st.dev, GSAP plugins, drei helpers). Use MCP servers / web search to find them. Hand-write
a component only when no maintained library fits after actually searching. Prefer copy-in
registries (shadcn-style) over heavyweight dependencies when both exist.

# Rule 1 — Front-End: verify before you write, never invent

**Stack (do not deviate):** Next.js 16.2.10 App Router (`app/`), React 19.2.4, Tailwind CSS v4 (`@tailwindcss/postcss`, CSS-first config in `app/globals.css` — there is NO `tailwind.config.js`), TypeScript strict. Animation/3D work uses the installed skills: GSAP (+ ScrollTrigger, `useGSAP` for React), Framer Motion, React Three Fiber / Three.js, React Spring, Lottie, Rive, Spline.

**Anti-hallucination protocol — every front-end task:**
1. **Read before writing.** Before using any Next.js API, config option, or file convention, read the matching page in `node_modules/next/dist/docs/` (`01-app/01-getting-started`, `02-guides`, `03-api-reference`). Never write Next.js code from memory — this version differs from training data.
2. **Verify libraries exist.** Before importing any package, confirm it's in `package.json`. If it isn't, say so and ask — do not import it, do not silently add it, and do not fabricate a similarly-named API.
3. **Verify symbols exist.** Before calling a component, hook, prop, or util from this codebase, open the file and confirm its actual name and signature. Never guess exports.
4. **Match what's on disk.** New components must follow the existing patterns in `app/` (server components by default; add `'use client'` only when the component uses state, effects, refs, browser APIs, or animation libraries). Reuse existing components/styles before creating new ones.
5. **No invented URLs, no invented CSS.** Tailwind v4 syntax only (e.g. `@theme`, `@import "tailwindcss"`) — do not emit v3 idioms (`@tailwind base/components/utilities`, `tailwind.config.js`). Do not cite docs links or example repos you haven't fetched.
6. **Animation correctness.** GSAP/R3F/Framer Motion code must follow the installed skill guidance: clean up animations on unmount (`useGSAP` scope / `gsap.context`), respect `prefers-reduced-motion`, animate only `transform`/`opacity` for 60fps, lazy-load 3D scenes (`next/dynamic`, `ssr: false` where required).
7. **Stay in scope.** Implement exactly what was asked. No unrequested pages, components, dependencies, refactors, or "bonus" features. If a task seems to require something outside the current stack, stop and ask instead of improvising.
8. **Prove it.** After a UI change, verify it compiles (`npm run build` or dev-server check) and, when visual behavior matters, verify in-browser via Playwright/Chrome DevTools before declaring it done. Never claim untested code works.

# Rule 2 — Token economy: think lean, report lean

**While working (thinking + tool use):**
- Keep internal reasoning minimal — decide, then act. No re-deriving facts already established in the conversation, no narrating options you won't take, no repeating file contents back into your reasoning.
- Read only what you need: targeted file sections (offset/limit), `grep` over full-file reads, never re-read files you just edited.
- Between tool calls, status notes of one short line at most — or nothing.
- Delegate broad searches to a subagent and keep only the conclusion; don't pull file dumps into the main context.

**Final message (every turn):**
- One concise summary the user can skim in ~15 seconds: **what changed** (files + one-line why), **how it was verified**, **anything the user must know** (breakage, follow-up, blockers). Nothing else.
- Prose or a short list, no headers/tables for small changes, no restating the plan, no pasting code the user can open, no marketing language ("robust", "seamless"), no offering unrequested next steps.
- If the task was a question, answer it in the first sentence, then stop.
