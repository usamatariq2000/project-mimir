---
description: Re-sync CLAUDE.md/AGENTS.md scope docs with PROJECT_SCOPE.md and the actual code
---

Re-initialize this project's context documentation. Follow these steps exactly:

1. Read `PROJECT_SCOPE.md` in full — it is the single source of truth for the AI-Operable
   Software Platform idea (vision, architecture components 7.1–7.8, MVP scope in §14, phases in §16).
2. Scan the actual codebase (`app/`, `package.json`, any `src/`, `lib/`, or server directories)
   and determine what has actually been implemented so far.
3. Update the **"Current Implementation Status"** section at the bottom of `PROJECT_SCOPE.md`
   with a dated entry reflecting reality: which architecture components (Integration Layer,
   Tool Generator, Tool Registry, Auth Manager, Agent Runtime, Execution Engine, Knowledge
   Layer, Audit System) exist, are partial, or are not started.
4. Update the **"Project Scope Summary"** section in `AGENTS.md` so it matches — keep it under
   15 lines; it is loaded into every session, so it must stay lean. Deep detail belongs in
   `PROJECT_SCOPE.md` only.
5. If the code contains anything that violates the MVP "AVOID" list in §14 (marketplace, UI
   builder, multi-agent systems, full database generator), flag it to the user explicitly.
6. Do NOT change the idea/vision sections (§1–§13, §15–§17) unless the user explicitly asked
   to change the scope itself.
7. Report a one-paragraph summary of what was synced.
