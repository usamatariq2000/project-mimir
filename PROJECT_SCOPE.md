# PROJECT_SCOPE.md — AI-Operable Software Platform

> **This file is the single source of truth for what this project is and what is in/out of scope.**
> Claude must read this before any feature work. If code changes alter the scope described here,
> this file AND the scope summary in `AGENTS.md` must be updated in the same turn.
> Codename: **Project Mimir** (concept names: Prometheus / Gia / Atlas).

## 1. Executive Summary

An **AI execution layer for software systems** that enables AI agents to operate business
applications directly. Instead of humans clicking dashboards or manually calling APIs, AI agents:

- Understand backend systems
- Decide actions
- Execute workflows
- Manage operations end-to-end

The platform converts any software — existing or new — into an **AI-operable system**.

## 2. Vision

Become the **universal control layer between AI and software**. The future interaction model:

- Humans express intent in natural language
- AI agents execute business operations
- Software exposes machine-readable capabilities instead of UI-first interfaces

## 3. Problem

Modern software is not designed for AI:

- Software is UI-centric (built for humans)
- APIs are inconsistent and fragmented
- Business logic is hidden inside systems
- Every integration requires custom engineering
- No standard way for AI to operate real systems safely

## 4. Solution

An **AI execution runtime layer** that sits between AI and software. It:

- Connects to existing systems (APIs / DBs)
- Extracts capabilities automatically
- Converts them into structured "AI tools"
- Executes actions safely
- Logs every operation
- Provides controlled AI access to business systems

## 5. Core Idea

> "Every software system can be represented as a set of AI-executable tools."

Example: `GET /orders` → `get_orders()`, `POST /refund` → `refund_payment()`.
AI uses these tools instead of UI or manual APIs.

## 6. Product Modes

**Mode 1 — Existing Software:** user already has a backend + APIs. We provide API connection,
tool generation, AI agent layer, execution runtime. → *AI can operate their system.*

**Mode 2 — New Build:** user only has an idea. We generate database schema, backend system,
API layer, AI agent runtime. → *AI-native software from day one.*

## 7. System Architecture

| Component | Responsibility |
|---|---|
| **7.1 Integration Layer** | Connects to REST APIs, webhooks, databases (future). Handles auth, request execution, endpoint discovery. |
| **7.2 Tool Generator** | Transforms APIs into AI tools (`GET /users` → `list_users()`). Each tool has schema, description, permissions, execution rules. |
| **7.3 Tool Registry** | Central store for all AI actions: tool definitions, permissions, usage logs, metadata. |
| **7.4 Authentication Manager** | API keys, JWT, OAuth2. Secure storage, token refresh, **credentials never exposed to AI models**. |
| **7.5 Agent Runtime** | Core intelligence: understand intent, select tools, execute workflows, multi-step reasoning. |
| **7.6 Execution Engine** | Performs actual API calls: retries, error handling, rate limiting, response normalization. |
| **7.7 Knowledge Layer** | System context, API documentation, business logic mapping, tool descriptions. |
| **7.8 Audit System** | Tracks everything: prompt, tool selection, API calls, responses, errors, timestamps. |

## 8. Data Strategy

No fixed schema across systems. Each client has a flexible schema; JSON-based storage where
needed; **PostgreSQL + JSONB** for adaptability.

## 9. Agent Workflow

1. User gives instruction → 2. AI interprets intent → 3. System selects tools →
4. Execution layer runs APIs → 5. Response returned → 6. Everything logged.

## 10. Use Cases

- **Finance:** refund failed payments, generate invoices, detect anomalies
- **E-commerce:** manage orders, handle inventory, process returns
- **Customer Support:** auto-reply tickets, resolve issues, process refunds
- **Analytics:** natural-language insights, KPI analysis, business reporting
- **Logistics:** routing optimization, fleet management, delivery tracking

## 11. Security Model

- AI never sees credentials
- All actions are permission-controlled
- Every execution is logged
- Sensitive actions require approval
- Encryption at rest + in transit

## 12. Competitive Landscape & 13. Differentiation

Unlike automation tools (Zapier-style human-defined workflows), API-to-AI converters (no deep
system understanding), and cloud AI platforms (infrastructure only), this system:

- Operates at **system level**, not workflow level
- Allows AI to execute **real business actions**
- Works with both existing and new software
- Abstracts backend complexity into tools
- Introduces a **controlled AI execution layer**

## 14. MVP Scope

**BUILD (in scope now):**
- API ingestion (OpenAPI support)
- Tool generator
- Agent runtime
- Execution engine
- Chat interface
- Logging system

**AVOID (explicitly out of scope for MVP — do not build these):**
- Marketplace
- UI builder
- Multi-agent systems
- Full database generator

## 15. Tech Stack

- **Backend:** Python (FastAPI) in a SEPARATE repo — `../mimir-engine`. Chosen 2026-07-06
  over Node/TS for ML-ecosystem depth and the founder's ML learning goals.
- **LLM:** provider-agnostic via LiteLLM — local Ollama (`qwen2.5:7b`) for free development;
  Claude/OpenAI swappable by env var alone. No custom model training for MVP (fine-tuning
  is a planned Python learning side-project post-MVP, using accumulated execution logs).
- PostgreSQL 16 (JSONB) on Docker :5433; Redis :6381 (reserved for the Phase-2 ARQ job queue)
- Docker-based deployment
- **This repo:** Next.js 16.2.10 (App Router) + React 19.2.4 + Tailwind v4 — the front-end
  only; it will consume the engine's HTTP API (engine on :8010, sample API on :8001).

## 16. Development Phases

- **Phase 1 (MVP):** API → tools, agent execution, chat interface ← **← WE ARE HERE**
- **Phase 2 (Production):** OAuth integration, permissions system, team features, monitoring dashboard
- **Phase 3 (AI Backend Generator):** generate full backend from prompts
- **Phase 4 (Ecosystem):** external AI connectors, multi-platform integration

### Deferred backlog — knowledge & anti-hallucination hardening (later stages)

The self-knowledge RAG + code-level grounding harness are live (see status log). These
accuracy upgrades are intentionally deferred until later; do them when knowledge accuracy
becomes a priority (they attack RECALL — finding true facts — while the harness already
guarantees no-lie by refusing when unsure):
- **Hybrid search** — combine keyword (BM25) with vector search so exact tokens ("?", SKU
  codes) aren't missed by embeddings alone.
- **Reranking** — retrieve ~20 candidates, re-score with a cross-encoder for true relevance.
- **Query rewriting / HyDE** — expand or rephrase odd user phrasings before searching.
- **Stronger embedding model** — sharper match/noise separation; lets the floor rise safely.
- **Evaluation set** — scripted Q→expected-answer list to MEASURE recall + hallucination rate
  as a number, so the confidence floor is tuned with evidence, not by hand.
- **pgvector** — move cosine search into Postgres (ANN index) for scale.

### Deferred backlog — network connectivity (real enterprise APIs)

- Static egress IPs (for customer IP-allowlists), mTLS client certs (as a vault credential
  type), and a customer-run connector agent / relay for private-network (VPC) APIs. CORS is
  a browser concern and does NOT block the server-side executor.

## 17. Long-Term Vision

Software shifts from UI-driven systems → AI-operated systems. Humans define intent, AI executes
operations, software exposes capabilities instead of interfaces. This platform becomes the
execution layer powering that transformation.

---

## Current Implementation Status

<!-- SCOPE-SYNC: keep this section in sync with the actual code. Updated by the Stop hook + /init command. -->

- **2026-07-09 (auth capture moved into the commissioning interview):** the per-API credential is now
  set DURING onboarding, not in a pre-step. The commissioning terminal owns the Authentication step
  (none / bearer / API key / basic / login-auto-token) with masked fields and a "Test & discover"
  button for the login scheme (which uses the base URL the interview just confirmed); the AI asks about
  auth in its opening message and commit is gated until auth is decided (login requires a proven
  recipe). Credentials go in secure fields, never into the chat log. Clarified distinction: the
  operator's **Mimir login** (their platform account) is separate from the per-API **service account**
  (the customer's dedicated "AI operator" user on their own system, stored in the vault). Verified
  in-browser end-to-end: doc → interview → "login (auto-token)" → discovered + proven → committed as
  auth_type=login (creds never leak). OpenAPI path keeps its pre-couple auth panel (no interview).

- **2026-07-09 (Credential Broker — the AI operator logs itself in):** for APIs that issue tokens via
  a login endpoint (most REST/mobile backends), the customer gives Mimir a dedicated **service-account
  credential** and the engine handles tokens itself — no pasting/rotating expiring tokens. New
  `auth_type=login` stores the creds + a deterministic **login recipe** encrypted; `app/broker.py`
  calls the login API, caches the token with its expiry, and **transparently re-logins on a 401**.
  `POST /systems/discover-login` is the AI-discovery step: the model proposes the login endpoint (from
  the docs, or an explicit path) and, after a **real test-login**, locates the token/expiry field in
  the actual response — then a deterministic recipe is frozen (AI discovers, code executes — Doctrine
  #2/#7). The deck's auth panel gains a **"login (auto-token)"** option with a Test &amp; discover button.
  Verified: `eval/broker_check` 6/6 (discover → couple → mint → re-login after invalidation → honest
  fail on bad creds), intent harness 9/9, in-browser discovery proven. Remaining broker work: cookie
  inject target, refresh-token endpoints, OAuth2 client-creds variant, discovery inside commissioning.
  Out of scope (honest-refuse): request-signing (SigV4/HMAC), mTLS, interactive MFA/CAPTCHA.

- **2026-07-09 (credential recovery):** an expired/revoked token no longer means deleting and
  re-coupling a system (which would lose its context + knowledge). `PATCH /systems/{id}/auth` rotates
  the vaulted credential in place; the executor now tags a 401/403 as `auth_error` with a "reconnect"
  hint instead of a generic failure (also the hook the future Credential Broker will use to
  auto-refresh); the deck shows a ⟳ Reconnect button on each live system that opens a small panel to
  set the new credential. Verified: `eval/reauth_check` 4/4 (wrong token → auth failure surfaced →
  rotate in place → same system recovers), intent harness still 9/9, in-browser rotate confirmed
  (auth_type changes, token never leaks). First slice of the **Credential Broker** design (service-
  account login-recipe with AI-discovered, human-confirmed, code-executed token acquisition/refresh).

- **2026-07-07 (commissioning — verify the whole reading + take suggestions):** the interview now
  covers more than base URL + writes. The engine extracts **domain vocabulary** from the docs and asks
  the operator to confirm/correct it (confirmed terms feed the grounding glossary); flags **reads that
  look like they expose personal data** and offers to gate them (only writes gate by default); and the
  operator can **edit capabilities, risks, and per-op gating** in their own words (clarify patch) or by
  clicking a badge in the terminal. The review panel shows the extracted vocabulary and a **holistic
  plain-English summary with an explicit "this reading is correct" sign-off** that (plus a base URL)
  gates commit — so confirmation, not just model confidence, is the accuracy floor. Gap resolutions are
  sticky. Verified: `eval/commission_check` 13/13 + full in-browser E2E (gate toggle, glossary, added
  risk, sign-off, commit). Known 7B quirk: an ambiguous reply can override a UI gate toggle (documented
  in engine AGENTS.md).

- **2026-07-07 (commissioning — verify-before-commit onboarding):** vague docs (relative
  paths, no host — the `{baseurl}/user/{id}` problem) no longer produce a silent, possibly-wrong
  system. New flow: `POST /systems/draft` infers an interpretation and a **code-computed gap list**
  (missing/placeholder base URL, unparsable ops, each destructive write, weak-confidence purpose) —
  nothing persisted; `POST /systems/clarify` runs one interview turn (model proposes a reply +
  structured patch via `complete_json`, code applies it deterministically, gaps recomputed);
  `POST /systems/commit` is the gate — persists only the operator-confirmed interpretation, base URL
  required. Front-end: the deck's text-doc path opens a **commissioning terminal** (Operations-Ledger
  console, no glow) — full interpretation on the left for review, the AI's targeted questions on the
  right, draft refines live, commit disabled until confirmed. Confirmation + confidence together are
  the accuracy gate (Doctrine #7 verify-before-commit, #12 grow-from-confirmation). Verified:
  `eval/commission_check` 9/9 + full in-browser E2E (vague notes → base URL elicited in chat →
  committed system on the deck).

- **2026-07-07 (Step 5 — undocumented-API ingestion, for real):** the "only a text document"
  path is no longer a mock. Engine `ingestion.infer_from_doc` feeds pasted human-written docs to
  the model under a validate-and-repair contract (`complete_json`) and extracts a callable
  operation list; unusable docs are refused honestly rather than fabricated (Doctrine #4/#8).
  `POST /systems` accepts `doc` OR `spec_url`; both flow through the same tool-build + capability
  eval + knowledge index. The deck's AddSystemPanel text mode now couples for real when the
  engine is live (base URL captured for execution). Verified: `python -m eval.ingest_check` 5/5;
  intent harness still 9/9 (no regression from the `ingest_spec` refactor). Also recorded an
  architectural-stance note in `../mimir-engine/AGENTS.md` ("Deliberately NOT building"):
  rejected premature multi-agent/graph-DB/code-AST/model-bumping; queued role-scoped authZ and a
  memory taxonomy as in-scope borrows, each gated behind a harness case.

- **2026-07-06:** Full front-end shell built (no backend yet, all data from `app/lib/mock-data.ts`):
  landing (`/`, `/platform`, `/security`), auth (`/login`, `/signup` — "operator handshake",
  `/logout` — session-seal screen),
  onboarding (`/onboarding` — 6-part "commissioning" flow), and app view (`/app` — Command Deck:
  calm intent line → live canvas during execution → filed record, with per-system Focus mode).
  Design system v3 "Operations Ledger": carbon/bone/acid palette, Archivo Black display,
  Geist Mono metadata, flat brutalist rules, GSAP scramble/reveal, Magic UI marquee.
  Component libraries via shadcn registry (see AGENTS.md Rule 0 — libraries first).
  App-wide Lenis smooth scroll synced to ScrollTrigger; custom "scroll gauge" replacing the
  native scrollbar (machinist-rule rail starting below the sticky header, velocity-reactive
  acid needle with percent readout, click/drag scrubbing through Lenis; suppressed on /app,
  where the Monitor tab has its own segmented signal-meter scrollbar and only the middle
  content area scrolls); animated ledger backdrop (ruled paper + scroll-driven
  scan line); /platform rebuilt with pinned "conversion machine"
  scrub scene + animated parts inventory; /security rebuilt with pinned credential
  "redaction" scene, approval stamp, and live audit tape. Command Deck canvas now runs on
  React Flow (@xyflow/react): system nodes with marching-ants running borders, animated
  inter-system hand-off edges when unconfined, confined mode wiring only the focused system,
  and a docked intent bar in the canvas so consecutive commands chain without returning to
  the calm screen. Deck also has: first-login walkthrough (driver.js, replayable via [?]),
  per-session boot preflight that pings each system before unlocking the deck, a Monitor tab
  (system liveness cards + activity ledger incl. this session's runs), an interactive
  "Update APIs" flow (scan spec → show diff → apply → tool count updates), an app-wide
  GSAP smooth cursor that reacts to interactive elements, and "add system" coupling flows in
  BOTH the deck (+ couple a system) and the signup commissioning step — each supporting
  OpenAPI specs and undocumented APIs (paste a text document → staged inference evaluation
  with per-tool confidence scores and human confirmation of low-confidence tools).
- **2026-07-07 (AI engineering doctrine + structured generation):** encoded a 12-principle
  "AI Systems Engineering Doctrine" as RULE 0 in `../mimir-engine/AGENTS.md` — the standard
  every agent change is held to (small-model-first, code-enforces-not-prompts, eval-driven,
  structured-over-parsed, retrieve-don't-stuff, route/decompose, verify-before-commit,
  ground-or-abstain, circuit-breakers, observability, provider-agnostic, grow-the-knowledge).
  Goal: quality lives in the engineering so the system runs flawlessly even on the 7B floor
  model. First application: `llm.complete_json` — structured generation (Ollama JSON mode +
  validate-and-repair against a contract) replacing "regex-parse and hope" in capability
  evaluation and memory distillation. Harness held **9/9** on qwen2.5:7b.
- **2026-07-07 (Step 3 — business-context grounding):** the founder's idea, built. Each
  coupled system carries a business `context` (`{description, glossary}`) that is injected
  into (1) the capability evaluation prompt, (2) the agent's action prompt, and (3) the
  knowledge index — so `get_user_details` reads as domain-specific and jargon resolves.
  Verified: with a glossary mapping "bounced payment" → status=failed, "how many bounced
  payments?" correctly answered 6 (a term absent from the API). Coupling UI captures a
  description + a "term = meaning" glossary. Harness grew a `context` case → **9/9 (100%)**.
- **2026-07-07 (Step 5 — accuracy harness):** "feels accurate" is now a NUMBER.
  `mimir-engine/eval/` scores the agent against scripted cases (action / read / meta /
  grounding / safety): resets the sample API per case, runs the intent, auto-approves held
  writes (exercising the gate), checks world-state + reply. `python -m eval.harness` →
  scorecard + `eval/scorecard.json`. Baseline **8/8 (100%) on qwen2.5:7b**. The harness
  immediately caught a real bug: `/intents` bypassed the router/grounding layer (only
  `/chat` had it) — fixed by extracting `_route_and_run`, shared by both, closing the
  hallucination backdoor. Sample API gained `/reset`; `/health` now reports the model.
- **2026-07-07 (Step 2 — credential vault):** the executor can now authenticate to protected
  APIs. Engine `vault.py` Fernet-encrypts per-system credentials (`systems.auth_enc`);
  supported schemes: bearer, api_key (custom header), basic (OAuth2 client-credentials next).
  The credential is decrypted ONLY in the executor at call time and injected into the HTTP
  request — never returned by any endpoint, logged, or shown to the model (`/systems/{id}`
  exposes `auth_type` only). Coupling UI gained an Authentication section. Verified: a
  bearer-protected Acme endpoint returns 200 through the executor while the token never
  appears in any API payload. This unblocks coupling real third-party APIs (e.g. Stripe test
  mode, which uses a bearer secret key). Sample API gained `/secure/status` to prove it.
- **2026-07-07 (UX):** the deck boot-preflight animation now replays on every fresh
  login/signup (auth clears the once-per-session flag) as the entrance sequence — pure
  front-end, no backend stream. Restored the signup "Access granted" beat timing.
- **2026-07-07 (Step 1 — REAL authentication):** login is no longer theater. Engine has a
  User model, argon2 password hashing, and stateless JWT sessions; `/auth/register|login|me`
  issue/verify tokens, and EVERY operational endpoint (systems, intents, chat, runs, audit,
  memories, approvals — REST and SSE) now requires a valid token (401 otherwise). The
  authenticated operator's email is stamped on `runs.operator` and audit events, so approvals
  are attributable to a real person. Deck: the auth screens call the engine for real, store
  the JWT and send it on every request, the deck redirects to /login when unauthenticated,
  the header shows the real operator name, and log out clears the token. Verified e2e:
  redirect-when-unauthed, signup→token→onboarding, real operator in header + DB. AGENTS.md
  security summary updated. (Credential vault for third-party APIs is Step 2, still pending.)
- **2026-07-07 (token streaming + markdown):** AI replies now stream token-by-token into the
  deck conversation (engine `llm.stream()` → reply_start/token/reply_end SSE; the deck types
  the answer live with a blinking cursor) and render as rich Markdown — headings, **bold**,
  numbered/bulleted lists, code — via react-markdown themed to the ledger palette
  (`MarkdownMessage.tsx`). Verified: 112 streaming frames captured mid-answer, markdown
  structure rendered. Also logged deferred backlogs in §16 (RAG hardening; network connectivity).
- **2026-07-07 (full knowledge corpus + grounding harness):** the knowledge base now
  documents EVERYTHING Mimir does — every landing page/section/design feature, every deck
  button and control (incl. "+ couple a system"), auth/onboarding, the Monitor tab, and all
  backend capabilities (44 chunks in `self_knowledge.py`). Added a CODE-LEVEL grounding
  harness (not a prompt): the router classifies meta/action/offtopic, and meta answers
  require the top retrieved chunk to clear a calibrated confidence floor (0.58) — below it,
  or when off-topic, the engine returns a deterministic SAFE_UNKNOWN response WITHOUT calling
  the model, so hallucination is structurally impossible. Verified: the previously-hallucinated
  "couple a system button" now answers correctly; off-topic questions ("capital of France",
  "bake bread") return the identical safe refusal; real actions still execute. Refined with
  10 focused one-fact-per-control chunks (the '?' tutorial button, tabs, new-session, etc.)
  after a buried-fact retrieval miss — rule: each new UI control/capability needs its own
  chunk in self_knowledge.py + a reindex. Corpus now 64 chunks.
- **2026-07-06 (self-knowledge RAG):** the agent now KNOWS the system. Engine `knowledge.py`
  adds Retrieval-Augmented Generation — Mimir's identity docs and every coupled system's
  capabilities are embedded (Ollama nomic-embed-text) into `knowledge_chunks`; each query
  retrieves the top-k relevant chunks (cosine) into the prompt, token-bounded. A semantic
  router sends meta-questions ("what is this system?", "what are tools?") to a tool-free
  knowledge answer and action-requests to the agent loop. Verified: it now explains itself,
  the tool vocabulary, and which APIs are coupled. Deck: conversation feed is height-bounded
  and scrollable with its own punch-tape scrollbar (read-head + ▼latest pill, smart no-yank
  autoscroll) — distinct from the landing gauge and monitor meter.
- **2026-07-06 (deck de-mocked):** the Monitor tab is real — activity ledger streams from
  `/runs`, liveness cards show wire-measured latency pinged by the engine, and a new
  "Learned knowledge" section displays the memory bank. "+ couple a system" (OpenAPI path)
  now performs REAL coupling through the engine, browser-verified. Engine gained
  DELETE /systems/{id}. Remaining mock surfaces: Update-APIs diff flow, text-doc coupling
  path, uptime-30d, operator names (until real auth).
- **2026-07-06 (conversational agent + memory):** the intent line is now a conversation.
  Engine: persistent chat sessions (context since the beginning), discuss-before-acting
  policy (reads run freely; writes still hard-held by the approval gate), and a growing
  memory: durable facts are distilled after each turn and injected into all future
  sessions — verified end-to-end (taught "refunds = givebacks" in one session; recalled
  in a fresh session). Deck: the receipt is a conversation feed with session persistence
  and a ⟳ new-session control. Known ceiling: qwen2.5:7b needs guards (stall circuit
  breaker, degradation guard, grounding rules — all in place); swap LLM_MODEL for quality.
- **2026-07-06 (live streaming):** the deck is now genuinely real-time. The engine streams
  run events over SSE (thinking / executing / step / held / filed) from
  `/intents/stream` and `/runs/{id}/resolve/stream`; the canvas lights nodes and prints
  receipt lines the moment tools actually execute, with a visible "core reasoning…" state
  during model turns. Blocking endpoints remain as fallback. Browser-verified live.
- **2026-07-06 (approval enforcement):** the security model has teeth. Gated tools now HOLD
  the run server-side (conversation persisted), the deck shows the pending action in an
  ember approval card (Approve · run it / Deny), and the verdict — itself audited — resumes
  the agent loop. Browser-verified: intent → held → approve → 6 real refunds → filed.
- **2026-07-06 (LIVE end-to-end):** the full loop is real: deck → engine → local LLM →
  actual API mutations. Ollama + qwen2.5:7b installed; the agent listed Acme's payments,
  found 6 failed, issued 6 real refunds (all HTTP 201, verified in Acme's state), every
  step audited. The deck auto-detects the engine (`app/lib/engine.ts`): header shows
  "engine live", the systems strip shows real coupled systems from the registry, and
  intents run through `/intents` with the scripted demo as offline fallback. Engine docs:
  `../mimir-engine/AGENTS.md` (run book, invariants, machine gotchas, next steps).
- **2026-07-06 (backend):** `../mimir-engine` repo created (Python/FastAPI): OpenAPI
  ingestion → tool generation (writes auto-gated) → capability evaluation (individual +
  joint + risks, LiteLLM with honest heuristic fallback) → agent runtime + HTTP executor →
  append-only audit trail in Postgres.
- **2026-07-05:** Repo was a fresh Next.js starter.
