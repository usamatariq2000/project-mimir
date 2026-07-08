# Project Mimir — Command Deck

The front-end for **Mimir**, an AI-operable software platform: an execution layer that turns any
software (existing APIs or pasted docs) into safe, logged, permission-controlled AI tools, so AI
agents can operate business systems directly — permissioned, approval-gated, and audited.

This repo is the operator's cockpit — the **Command Deck**. The Python execution layer lives in the
separate [**mimir-engine**](https://github.com/usamatariq2000/mimir-engine) repo. The deck talks to it
at `http://127.0.0.1:8010` (auto-detected, with a demo fallback when the engine is offline).

> Full product idea, architecture, and phase plan: [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md).
> Working rules for contributors/agents: [`AGENTS.md`](AGENTS.md).

## What's here

- **Landing** (`/`, `/platform`, `/security`) — the product story.
- **Auth** (`/login`, `/signup`, `/logout`) — the "operator handshake"; real JWT auth against the engine.
- **Onboarding** (`/onboarding`) — a guided "commissioning" flow.
- **Command Deck** (`/app`) — the core: a calm intent line that becomes a live React Flow canvas during
  execution, a held-approval card for gated writes, per-system focus, a Monitor tab (system liveness +
  activity + memories), a boot preflight, and a first-run tour.
- **Commissioning terminal** — pasting an undocumented API's notes opens a verify-before-commit console:
  the engine's inferred interpretation (purpose, operations, joint capabilities, risks, extracted
  vocabulary) on the left for review, its targeted questions on the right, per-operation gate toggles,
  and a holistic "this reading is correct" sign-off that gates commit.
- **Live features** — token-by-token streaming of agent replies, Markdown rendering, real activity and
  audit from the engine.

## Design system — "Operations Ledger"

A deliberate, non-generic visual language: carbon / bone / acid palette, Archivo Black display, Geist
Mono metadata, flat brutalist rules, film grain, GSAP scramble/reveal, smooth scroll. No blue/purple,
no glass/glow/gradient-text. The goal is instrument-panel precision, not AI-slop gloss.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 (CSS-first `@theme` in
`app/globals.css` — there is no `tailwind.config.js`) · TypeScript (strict). Animation/interaction via
GSAP (+ ScrollTrigger), Lenis, React Flow (`@xyflow/react`), Magic UI components, and driver.js.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000
```

The deck runs on mock/demo data on its own. For the **live** experience (real auth, real agent runs,
commissioning), also run the engine — see the
[mimir-engine README](https://github.com/usamatariq2000/mimir-engine#run-it). Point the deck at a
non-default engine with `NEXT_PUBLIC_ENGINE_URL`.

```bash
npm run build          # production build
npm run start          # serve the production build
npm run lint           # eslint
```

## Project layout

```
app/
├── (marketing)/        landing, platform, security
├── (auth)/             login / signup console
├── onboarding/         commissioning flow
├── app/                the Command Deck (CommandDeck, CommissioningTerminal, MonitorPanel, …)
├── components/         shared UI (nav, footer, smooth scroll/cursor, reveal, scramble)
├── lib/engine.ts       the engine client (auth, systems, runs, SSE streaming, commissioning)
├── lib/mock-data.ts    demo data for offline/standalone mode
└── globals.css         the Operations Ledger design system (Tailwind v4 @theme)
```

## License

Not yet licensed — all rights reserved by the author for now.
