#!/bin/bash
# ─── IoT at CHRIST — Claude Code Session Start Hook ──────────────────────────
# Runs at the start of every Claude Code session.
# Purposes:
#   1. Install/verify Node dependencies so lint + tests work immediately
#   2. Print a compact project snapshot to prime Claude's context efficiently,
#      reducing token usage needed to re-discover architecture each session
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}/iot-at-christ"

# ── 1. Dependency install (async — runs while session loads) ─────────────────
# Output the async signal first so the session starts immediately
echo '{"async": true, "asyncTimeout": 120000}'

# Only install if node_modules is missing or package.json is newer
if [ ! -d "$APP_DIR/node_modules" ] || \
   [ "$APP_DIR/package.json" -nt "$APP_DIR/node_modules/.package-installed" ]; then
  cd "$APP_DIR"
  npm install --no-audit --no-fund --legacy-peer-deps 2>&1
  touch "$APP_DIR/node_modules/.package-installed"
fi

# ── 2. Compact context snapshot (printed to Claude's context window) ──────────
# This replaces the need for Claude to re-read every file at session start.
# Keep this under ~500 tokens — just enough to orient without bloating context.

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

cat << 'SNAPSHOT'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IoT at CHRIST — Session Context Snapshot
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STACK:  Next.js 14 App Router · TypeScript · Supabase · Tailwind
REPO:   /home/user/Academic/iot-at-christ/

ROLES:         teacher | student | coordinator | supervisor
ROLE ROUTES:   /teacher  /student  /coordinator  /supervisor
MIDDLEWARE:    iot-at-christ/middleware.ts (role-based routing + onboarding guard)

KEY LIBS:
  lib/supabase/server.ts      — Server Component / Server Action client
  lib/supabase/client.ts      — Browser client
  lib/roles/permissions.ts    — canSignOffPhase, canReadPhase, canReadSection…
  lib/notifications/send.ts   — sendNotification(type, recipientId, data)
  lib/anthropic/              — research-suggest.ts, paper-draft.ts

DB MIGRATIONS:
  supabase/migrations/001_initial_schema.sql   — core schema
  supabase/migrations/002_supervision_model.sql — supervisor/coordinator layer

SUPERVISION TABLES:
  project_supervisors  (tagged_phases int[], tagged_sections text[])
  phase_signoffs       (unique per phase, upsert for coordinator override)
  supervision_comments (is_private, parent_id for threading)
  supervision_meetings (action_items jsonb)
  research_questions   (checklist_completed guard)
  notifications        (realtime + email via Resend)

COMPONENTS (components/supervision/):
  SignOffModal · SupervisorCard · CommentThread · MeetingNoteForm · QuestionForm

DEPLOY:
  Vercel (production=main, preview=claude/* branches)
  CI/CD: .github/workflows/ci.yml · .github/workflows/deploy.yml
  Secrets needed: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

DESIGN TOKENS:  christ-navy=#1B2E4B  christ-saffron=#E8720C  christ-gold=gold
COMMANDS:       npm run dev | build | lint | type-check | test:run | seed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SNAPSHOT

# ── 3. Show recently changed files (helps Claude resume in-progress work) ────
echo "RECENTLY MODIFIED FILES (last 24h):"
find "$APP_DIR" \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/.git/*" \
  -newer "$APP_DIR/package.json" \
  -name "*.ts" -o -name "*.tsx" -o -name "*.sql" -o -name "*.yml" \
  2>/dev/null | sort | head -20 || true

echo ""
echo "Session ready. Dependencies verified. ✓"
