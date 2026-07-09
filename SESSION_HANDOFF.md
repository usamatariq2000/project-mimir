# Session Handoff — Project Mimir

> Purpose: give a fresh Claude Code session the full working context of this project so it can
> continue without re-discovery. Read this first, then the canonical docs it points to.
> Last updated: 2026-07-08.

## 0. Read these first (canonical, authoritative)

A new session auto-loads `CLAUDE.md → AGENTS.md` and the auto-memory `MEMORY.md`. Beyond those:

- **`PROJECT_SCOPE.md`** (frontend repo) — the full product idea, architecture, phase plan, and a
  dated "Current Implementation Status" log. **The single source of truth for what's built.**
- **`AGENTS.md`** (frontend repo) — scope summary + Rule 0 (libraries first), Rule 1 (front-end
  anti-hallucination), Rule 2 (token economy).
- **`../mimir-engine/AGENTS.md`** (backend repo) — **RULE 0 "AI Systems Engineering Doctrine"** (12
  principles), architecture map, run book, machine gotchas, invariants, next steps. Read before any
  backend/agent work.
- This handoff = the connective tissue + how-to-resume + open threads. It does not replace the above.

## 1. What Mimir is (one paragraph)

Project Mimir is an **AI-operable software platform**: an execution layer that converts any software
(existing APIs or pasted docs) into safe, logged, permission-controlled AI tools (`GET /orders` →
`get_orders()`), so AI agents can operate business systems directly — permissioned, approval-gated,
audited. It is a **deliberately-engineered AI system, not a wrapper**: quality lives in the
scaffolding (routing, grounding, structured generation, eval harness, circuit breakers), so it runs
reliably even on a small local model.

## 2. Repos & layout

Two sibling git repos (NO git remotes by design — nothing is ever pushed):

- **`project-mimir/`** — front-end. Next.js 16.2.10 (App Router, Turbopack), React 19.2.4, Tailwind
  CSS v4 (CSS-first `@theme` in `app/globals.css`, NO `tailwind.config.js`), TypeScript strict.
- **`../mimir-engine/`** — back-end. Python 3.13, FastAPI, SQLAlchemy 2 async, Postgres 16 (JSONB),
  LiteLLM → Ollama (`qwen2.5:7b` chat, `nomic-embed-text` embeddings), argon2, PyJWT, Fernet vault,
  httpx. Plus a sample target API (`sample_api/` — "Acme Commerce": orders/payments/tickets).

The deck talks to the engine at `http://127.0.0.1:8010` via `app/lib/engine.ts` (auto-detect + demo
fallback). Override with `NEXT_PUBLIC_ENGINE_URL`.

## 3. Current status (as of this session)

Full-stack MVP is live and working end-to-end on the free 7B model:
- **Real auth** — engine issues JWTs (argon2 passwords); every operational endpoint requires a token;
  operator stamped on runs + audit. Deck login/signup call the engine, store the token, gate the deck.
- **Credential vault** — Fernet-encrypted per-system creds (bearer/api_key/basic); injected only in
  the executor at call time; the model NEVER sees secrets.
- **Agent runtime** — routed loop (meta/action/offtopic), tool-calling, HTTP executor, approval gate
  for writes, audit-before-action, circuit breakers (stall detection, repeat-call dedup, step budget),
  SSE token streaming, conversation memory + distillation.
- **RAG self-knowledge + grounding harness** — the system knows itself (self-knowledge corpus) and
  each coupled system; grounding floor → deterministic safe refusal (code, not prompt) when ungrounded.
- **Business-context grounding** — per-system `context {description, glossary}` injected into
  evaluation + agent prompts (e.g. glossary term "bounced" → status=failed).
- **Structured generation** — `llm.complete_json` (Ollama json-mode + validate-and-repair) everywhere
  model output must be trusted.
- **Accuracy harness** — `eval/harness.py`, 9 scored cases, **9/9 on qwen2.5:7b**. This is how changes
  are judged. It has already caught a real bug.

### This session's work — Commissioning (verify-before-commit onboarding)

The headline feature built in this session. Turns undocumented-API onboarding from a one-shot guess
into an operator-confirmed interview. Three backend endpoints + a front-end terminal:

- **`POST /systems/draft`** — `ingestion.infer_from_doc()` extracts a callable operation list from
  pasted human-written docs (structured + validated). `ingestion.compute_gaps()` (CODE decides what's
  uncertain) raises targeted questions: missing/placeholder **base URL**, unparsable ops, each
  **destructive write**, **sensitive/PII reads** (offer to gate), **domain glossary** to confirm,
  weak-confidence purpose. Capability eval also extracts `glossary_suggestions`. **Nothing persists.**
- **`POST /systems/clarify`** — one interview turn: `ingestion.clarify()` has the model return a
  `{reply, patch, resolved}` object (`complete_json`); `_apply_patch()` applies it DETERMINISTICALLY
  (model proposes, code writes). Patch can set base_url, system_purpose, per-tool purpose+permission
  (gate/un-gate reads), glossary, and add/remove joint_capabilities & risks. Gap resolutions are
  **sticky** (`interp.resolved_gaps`) so confirm-type gaps don't loop.
- **`POST /systems/commit`** — the gate: persists ONLY the operator-confirmed interpretation via the
  shared `_persist_system()`; base URL required. Never re-infers (would discard corrections).
- **Front-end**: `app/app/CommissioningTerminal.tsx` — Operations-Ledger console (no glow). Left =
  full interpretation for review (purpose, ops with per-op `read ⇄ / gated ⇄` toggle, joint
  capabilities, risks, extracted vocabulary). Right = the AI's targeted questions + chat. Bottom =
  holistic plain-English summary + explicit **"this reading is correct" sign-off** that (plus a base
  URL) gates commit. Wired from `AddSystemPanel.tsx` text mode when the engine is live.
- **Verified**: `eval/commission_check` **13/13**, `eval/ingest_check` **5/5**, intent harness 9/9,
  `tsc` clean, and full in-browser E2E (Playwright): vague notes → base URL elicited in chat → gate
  toggle → glossary/risk edits → sign-off → committed system on the deck.

## 4. Key files

**Backend (`../mimir-engine/app/`)**
- `main.py` — FastAPI surface. `/health`, `/auth/*`, `/systems` (couple) + `/systems/draft|clarify|commit`,
  `/intents(+/stream)`, `/chat/stream`, `/runs(+approve|deny|resolve/stream)`, `/audit`, `/memories`,
  `/knowledge/reindex`. Helpers `_persist_system`, `_draft_from_source`, `_encode_auth`.
- `ingestion.py` — `ingest_spec` (OpenAPI), `infer_from_doc` (docs→tools), `evaluate_capabilities`
  (+glossary_suggestions), `compute_gaps`, `clarify`, `_apply_patch`, `_summarize`.
- `runtime.py` — `_route_and_run` (shared router+grounding harness — BOTH /intents and /chat use it;
  never add a run path that bypasses it), `_continue_loop`, `_execute`, `_stream_reply`,
  `resolve_approval`, `_distill_memories`.
- `knowledge.py` — RAG (embeddings, cosine, scored retrieval, semantic `route()`, grounding floor).
- `llm.py` — provider-agnostic; `complete`, `complete_with_tools`, `stream`, `complete_json`.
- `self_knowledge.py` — the self-knowledge chunk corpus. `vault.py`, `auth.py`, `db.py`, `config.py`.
- `eval/` — `harness.py` (9/9 intent cases), `ingest_check.py` (5/5), `commission_check.py` (13/13),
  `cases.py`, `scorecard.json`.

**Front-end (`app/`)**
- `lib/engine.ts` — the engine client (token storage, all fetch calls, SSE `consumeStream`, the
  `engineDraft/Clarify/CommitSystem` commissioning clients + `DraftInterpretation` types).
- `app/CommandDeck.tsx` — the deck (React Flow canvas, intent bar, held-approval card, tabs, tour,
  auth gate, streaming). `app/CommissioningTerminal.tsx`, `AddSystemPanel.tsx`, `MonitorPanel.tsx`,
  `BootCheck.tsx`, `TourGuide.tsx`, `MarkdownMessage.tsx`.
- `(marketing)/`, `(auth)/AuthConsole.tsx`, `onboarding/CommissioningFlow.tsx`, `components/*`.
- `globals.css` — design system v3 "Operations Ledger" (carbon/bone/acid, Archivo Black, brutalist).

## 5. Run book (how to bring it up)

```bash
# backend
cd ../mimir-engine
docker compose up -d                                   # postgres :5433, redis :6381
source .venv/bin/activate
uvicorn sample_api.main:app --port 8001 &              # sample target API
uvicorn app.main:app --port 8010 &                     # the engine  (NEVER :8000 — see gotchas)
ollama serve & ollama pull qwen2.5:7b && ollama pull nomic-embed-text

# frontend
cd ../project-mimir && npm run dev                     # http://localhost:3000

# evals (engine + sample + ollama must be up)
cd ../mimir-engine && source .venv/bin/activate
python -m eval.harness            # intent accuracy → 9/9 baseline
python -m eval.ingest_check       # doc→tools → 5/5
python -m eval.commission_check   # commissioning flow → 13/13
```

Test operator (used by evals & browser testing): `eval@mimir.local` / `evalsecret1`.
The engine runs WITHOUT `--reload`; **restart it after editing `app/` Python** to load changes.

## 6. Hard rules & gotchas (do not violate)

- **Never push. No git remotes.** The user explicitly forbids pushing; neither repo has a remote.
- **Commit after every dev step** (each logical feature/fix), never push. Include the eval score in
  the commit message when the agent changed.
- **Sole author, no Claude co-author trailer.** Commits are `usamatariq2000
  <usamatariq2000@users.noreply.github.com>`. Do NOT add `Co-Authored-By: Claude`.
- **Never bind port 8000** — Docker squats `*:8000` on IPv6; `localhost`→`::1` hits the wrong server.
  Engine = **:8010**, always curl `127.0.0.1`. Postgres :5433, Redis :6381, sample API :8001.
- **Design**: Operations Ledger only — carbon/bone/acid, Archivo Black, flat brutalist. NO blue/purple,
  NO glass/glow/gradient-text slop. "Sci-fi" = mission-control/instrument precision, not neon.
- **Rule 0 (libraries first)**: search for an existing library/registry before hand-building UI.
- **Scope-sync**: any change altering scope must update `PROJECT_SCOPE.md` + `AGENTS.md` in the same
  turn (a Stop hook enforces this).
- **Engine invariants** (see `../mimir-engine/AGENTS.md`): model never sees credentials; every
  operational endpoint requires JWT; writes gated behind approval; audit before action; provider-agnostic
  (model = env config); honest fallbacks; changes to the agent must keep the harness green.
- **Doctrine**: small-model-first, code-enforces-not-prompts, eval-driven, structured-over-parsed,
  retrieve-don't-stuff, route-and-decompose, verify-before-commit, ground-or-abstain, fail-safe,
  observability, provider-agnostic, grow-the-knowledge.
- **Deliberately NOT building** (validated): multi-agent orchestration, code-AST indexing, a graph DB
  now, model-bumping to buy quality. See the "Deliberately NOT building" note in engine AGENTS.md.

## 7. Open threads / candidate next steps

- **Make the UI gate toggle authoritative** — a per-op badge toggle set in the terminal can currently
  be overridden by a later ambiguous clarify reply (the model owns the patch). Small fix: treat a
  UI-set permission as locked unless the operator explicitly changes it in chat.
- ~~Auth capture for doc-based systems~~ **DONE 2026-07-08** — the auth UI (bearer/api_key/basic) now
  renders in the text-doc path and flows through the commissioning commit; verified auth_type persists
  and the token never leaks. Doc-only APIs that need a token can now be tested live.
- ~~Credential recovery (expired token)~~ **DONE 2026-07-09** — `PATCH /systems/{id}/auth` rotates a
  credential in place (no re-coupling); the executor tags 401/403 as `auth_error` with a reconnect
  hint; the deck has a ⟳ Reconnect button per live system. `eval/reauth_check` 4/4, harness 9/9.
  This is the first slice of the **Credential Broker** (below).
- ~~Credential Broker~~ **BUILT 2026-07-09** — service-account creds → the engine mints & refreshes
  tokens itself. `auth_type=login` stores creds + a deterministic login recipe (`app/broker.py`
  mints/caches/re-logins on 401); `POST /systems/discover-login` has the AI find the login endpoint +
  token field and PROVE it with a real test-login; the deck's "login (auto-token)" auth option runs
  discovery and couples with the recipe. `eval/broker_check` 6/6, harness 9/9, in-browser verified.
  **Still to do on the broker:** cookie-session inject target, a refresh-token endpoint (vs re-login),
  OAuth2 client-credentials as a recipe variant, and wiring discovery into the commissioning interview
  (today it's in the coupling auth panel). Request-signing/mTLS/interactive-MFA remain out (honest-refuse).
- **`{baseurl}` mid-path normalization** — a literal `{baseurl}`/`{host}` token in pasted docs makes
  the model emit a path not starting with `/`, which gets dropped. Add a strip/normalize step.
- **OAuth2 vault scheme** — only bearer/api_key/basic today; OAuth2 client-credentials needs a new
  `vault.py` scheme before OAuth2-protected APIs can be operated.
- **Queued (from doctrine borrows, gated behind a harness case)**: role-scoped **authorization** (agent
  inherits operator permissions); explicit **memory taxonomy** (static/dynamic/operational/organizational).
- **Deferred backlog**: RAG hardening (hybrid search, reranking, HyDE, pgvector), OAuth2
  client-credentials vault scheme, ARQ/Redis job queue, network connectivity (static egress IPs, mTLS),
  LoRA fine-tune learning project on accumulated runs/audit.

## 8. User & working preferences

- Founder is **learning AI/ML** — when changing `llm.py`/`runtime.py`, explain the *why* (loop
  mechanics, prompt/technique design), not just the *what*.
- Wants a genuinely engineered system ("brain of the business"), cutting-edge technique, that runs
  flawlessly on the small model — NOT another AI wrapper. Do not propose bumping the model to fix
  design gaps.
- Token economy (Rule 2): think lean, act decisively, final message skimmable in ~15s.
- Values honest verification: prove UI changes in-browser (Playwright/Chrome DevTools) and report
  eval scores; never claim untested code works.

## 9. Current git state (for orientation)

- **project-mimir** HEAD: `fdcb9f1` (commissioning terminal + docs).
- **mimir-engine** HEAD: `96b4612` (commissioning coverage + docs).
- Both working trees clean at handoff except this file. Engine was DOWN at handoff time (bring it up
  via the run book).
