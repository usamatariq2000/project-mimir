#!/bin/bash
# Stop hook: at the end of every response, detect source-code changes that may
# affect project scope. If found (and not already handled), block once and ask
# Claude to reconcile PROJECT_SCOPE.md / AGENTS.md with the code.

INPUT=$(cat)

# Loop guard: if we're already continuing because of this hook, let the turn end.
if printf '%s' "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get('stop_hook_active') else 1)" 2>/dev/null; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

STATE=".claude/scope-sync-state"

# Fingerprint scope-relevant source: tracked diffs + untracked source files.
HASH=$( {
  git diff HEAD -- app src lib server package.json PROJECT_SCOPE.md 2>/dev/null
  git ls-files --others --exclude-standard -- app src lib server 2>/dev/null | sort | while read -r f; do
    printf '%s\n' "$f"; cat "$f" 2>/dev/null
  done
} | shasum -a 256 | cut -d' ' -f1 )

LAST=$(cat "$STATE" 2>/dev/null)

if [ "$HASH" != "$LAST" ]; then
  printf '%s' "$HASH" > "$STATE"
  cat <<'EOF'
{"decision":"block","reason":"[scope-sync hook] Source files changed during this response. Check whether the changes alter the project scope or implementation status. If yes: update the 'Current Implementation Status' section in PROJECT_SCOPE.md and the 'Project Scope Summary' in AGENTS.md to match, then finish. If no: state in one line that scope is unchanged and finish. Do not start new feature work."}
EOF
  exit 0
fi

exit 0
