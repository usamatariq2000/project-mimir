# Manual test guide — everything built so far

Written 2026-07-06. Two repos: this one (front-end, Next.js) and `../mimir-engine`
(Python engine + Acme Commerce sample API).

## 0 · Boot everything (skip what's already running)

```bash
# infra (postgres :5433, redis :6381)
cd ../mimir-engine && docker compose up -d

# local model server
ollama serve &                      # then optionally warm it (first call after idle ≈ 20s):
curl -s http://localhost:11434/api/generate \
  -d '{"model":"qwen2.5:7b","prompt":"hi","stream":false,"keep_alive":"30m"}' > /dev/null

# the sample system Mimir operates (RESEEDS DATA ON EVERY RESTART)
cd ../mimir-engine && .venv/bin/uvicorn sample_api.main:app --port 8001 &

# the engine
cd ../mimir-engine && .venv/bin/uvicorn app.main:app --port 8010 &

# the front-end
cd ../project-mimir && npm run dev          # usually http://localhost:3000
```

Sanity: `curl -s 127.0.0.1:8010/health` → `{"engine":"ok","llm":true}`.
⚠ Always use **127.0.0.1**, not `localhost`, for the engine — Docker squats `*:8000/::1`
on this machine and can shadow localhost requests.

## 1 · Landing site (design system "Operations Ledger")

Open `http://localhost:3000`:

- [ ] Hero type stamps in line by line; ticker tape of tool calls scrolls beneath.
- [ ] Smooth inertial scrolling everywhere (Lenis); custom cursor: acid dot + trailing
      ring that flares over links/buttons and collapses on click.
- [ ] Right edge: the **scroll gauge** (machinist rule) starts *below* the header — needle
      follows scroll with a velocity streak; hover shows percent; click/drag the rail scrubs.
- [ ] Left rail (xl screens): "MIMIR — OPERATIONS LEDGER" fully visible below header, live
      UTC clock at bottom, section numbers **light up acid** as you pass each section.
- [ ] "Entry 001 / Read this first": side-by-side chatbot-vs-Mimir comparison.
- [ ] Entry 002 table rows expand on click; headlines "decrypt" (scramble) as you scroll.
- [ ] `/platform`: pinned **conversion machine** — scrolling runs a chip through 4 stations
      (desktop only; static list on mobile). Parts inventory rows slide in with duty gauges.
- [ ] `/security`: pinned **redaction scene** — the Stripe key redacts block by block, the
      capability line appears, the APPROVE stamp slams with a screen shake. Live audit tape
      streams upward next to the clauses. On mobile it auto-plays instead of pinning.

## 2 · Auth + onboarding (front-end only)

- [ ] `/signup`: 3-question conversational console; the dial's rings engage per answer;
      redirects into `/onboarding`.
- [ ] `/onboarding` "commissioning": 6 parts; the schematic on the right assembles as you
      answer. In part 3 pick **Custom API → "Only a text document"**, paste ≥20 chars of
      fake notes, press **Evaluate the document** → fields collapse, staged inference runs,
      confidence bars appear; confirm a low-confidence tool; **Couple system**.
- [ ] `/login`: 2-step handshake → lands on `/app`.
- [ ] In the deck header: **⏻ Log out** → session-seal checklist + stamp → back to `/login`.

## 3 · The Command Deck — REAL engine + local model

Open `http://localhost:3000/app`:

- [ ] **Boot preflight** runs once per browser session (clear with:
      DevTools → `sessionStorage.removeItem("mimir.booted")`, reload).
- [ ] **Tutorial** auto-starts on first visit (reset: `localStorage.removeItem("mimir.tourDone")`),
      8 steps, auto-switches into the Monitor tab mid-tour. Replay anytime via **?**.
- [ ] Header shows **"1 systems · engine live"** (acid dot). If it says "demo mode", the
      engine is down; "engine up · no model" means Ollama isn't reachable.
- [ ] Systems strip shows **Acme Commerce** (real, from the engine registry).

**The core demo (live streaming + approval gate):**

1. Type: `Refund every failed payment that is not yet refunded` → Run.
2. Watch live: "▚ core reasoning…" pulses during model turns (each ≈ 4–10s);
   `list_payments` prints the moment it executes; the Acme node runs a marching-ants
   border while active.
3. The run **HOLDS**: ember card "⚠ Held — operator approval required" with the exact
   pending `create_refund(...)` call. This is the security gate — reads ran free, the
   write waits for you.
4. Click **Approve · run it** → refunds stream in one by one → summary files.
5. Verify reality: `curl -s "http://127.0.0.1:8001/payments?status=failed" | jq '[.[] | .refunded]'`
   → all `true`. Restart the sample_api process to reseed and run it again.
6. Re-run and click **Deny** instead → the model is told the operator refused and wraps up
   without mutating anything.
7. After a run files, type the next intent **directly in the docked bar** (no bounce back).

**Also on the deck:**

- [ ] Focus mode: click Acme in the strip → confined banner; intents get scoped.
- [ ] "+ couple a system" → same two-path evaluation as onboarding (front-end only for now).
- [ ] Monitor tab: liveness cards, interactive **⟳ Update APIs** diff flow, activity ledger
      (your session's real runs appear at the top). Only the middle section scrolls; the
      segmented meter on the right fills as you do. (Data here is still mock except
      session runs — wiring to real /runs//audit is a next step.)

## 4 · Engine API directly (curl)

```bash
curl -s 127.0.0.1:8010/health                          # {"engine":"ok","llm":true}
curl -s 127.0.0.1:8010/systems | jq                    # coupled systems
curl -s 127.0.0.1:8010/systems/<id> | jq .capabilities # LLM capability evaluation
curl -s 127.0.0.1:8010/runs | jq '.[0]'                # latest run record
curl -s 127.0.0.1:8010/audit | jq '.[:6]'              # the causal chain

# watch a run stream live in your terminal:
curl -sN -X POST 127.0.0.1:8010/intents/stream -H 'content-type: application/json' \
  -d '{"text":"How many open tickets are there?"}'

# couple a fresh system (e.g. after wiping the DB):
curl -s -X POST 127.0.0.1:8010/systems -H 'content-type: application/json' \
  -d '{"name":"Acme Commerce","spec_url":"http://127.0.0.1:8001/openapi.json","base_url":"http://127.0.0.1:8001"}'
```

Model itself: `ollama ps` (loaded/GPU/TTL), your Open WebUI at :3010, `tail -f /tmp/ollama.log`.

## 5 · Known quirks (expected, not bugs)

- First model call after ~30 idle minutes takes ~20s (cold load) — warm it (step 0).
- qwen2.5:7b sometimes retries an already-refunded payment (harmless 409 in the receipt)
  or exhausts its step budget before writing a nice summary. Model quality, handled safely.
- Landing-page Monitor/liveness numbers and the marketing pages' tool tables are
  presentation mock data; the deck's run pipeline is the real path.
