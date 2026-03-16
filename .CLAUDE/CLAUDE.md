# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Identity

**IoT at CHRIST** — a full-stack, open-source academic platform for Christ University Bengaluru's M.Tech CSE IoT programme.

- Owner: Ravesh Ashok Naik ([@ranaik09](https://github.com/ranaik09)) — ravesh.ashok.naik@gmail.com
- Stack: Next.js 14 (App Router) · TypeScript · Supabase · Tailwind CSS · shadcn/ui
- Content-driven: subjects/units/sessions are authored in YAML (`/content/subjects/`) and seeded to Supabase

---

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type-check
npm run type-check          # tsc --noEmit

# Seed content to Supabase (idempotent — safe to re-run)
npx tsx scripts/seed-subjects.ts

# Run a single test file
npx vitest run <path-to-test>

# Generate Supabase types
npx supabase gen types typescript --project-id <id> > types/database.ts

# Run Supabase Edge Functions locally
npx supabase functions serve sync-classroom
npx supabase functions serve send-session-reminders

# Apply DB migrations
npx supabase db push
```

---

## Architecture

### Routing & Role Split

Two protected sub-trees with distinct layouts:
- `/teacher/*` — instructor-only (Ravesh). Curriculum management, grading, Classroom sync, reminder scheduling.
- `/student/*` — enrolled students. Lessons, assignments, missions, research, leaderboard.

`/middleware.ts` reads `profiles.role` from the Supabase session and hard-redirects unauthenticated or wrong-role requests. `/app/dashboard/page.tsx` is the post-login router that dispatches to the right sub-tree.

### Database (Supabase Postgres)

Full schema lives in `supabase/migrations/001_initial_schema.sql`. Key relationships:

```
subjects → units → sessions
profiles (role: teacher|student)
enrollments (student ↔ subject, stores Google Classroom course ID)
assignment_submissions (session ↔ student, status: pending|submitted|graded)
student_progress (session ↔ student, XP tracking)
research_projects → research_phases, paper_sections
forum_posts → forum_replies
reminder_schedules (idempotency guard for the email system)
```

RLS is enforced on every table. The service role key is **never** sent to the browser — all privileged queries run in Server Components, Server Actions, or Edge Functions.

### Content System (YAML → DB)

`/content/subjects/iot.yaml` is the canonical source of the 40-hour IoT syllabus (7 units, 25 sessions, 5 missions). The schema contract is `/content/subjects/_schema.ts`.

`/scripts/seed-subjects.ts` validates YAML against the schema, then upserts to Supabase. **Adding a new subject requires only a new `.yaml` file — no application code changes.** Subject identity is the `slug` field (e.g. `iot`).

### Supabase Clients

Three distinct clients — use the right one for the context:
- `lib/supabase/client.ts` — browser (anon key, RLS-bound)
- `lib/supabase/server.ts` — RSC / Server Actions (reads cookies, anon key + RLS)
- Edge Functions — use the service role key from env, never exposed to client

### Google Classroom Integration

**Read-only.** The platform never writes to Google Classroom.

OAuth scopes requested on first login: `classroom.courses.readonly`, `classroom.rosters.readonly`, `classroom.coursework.students.readonly`. Tokens stored encrypted in Supabase.

`supabase/functions/sync-classroom/` syncs roster → `enrollments`. Runs daily at 06:00 via pg_cron, and manually via `/api/classroom/sync`.

### Reminder Email System

`supabase/functions/send-session-reminders/` runs every hour via pg_cron. It:
1. Queries `sessions.scheduled_at` in the 23h–25h-from-now window
2. Checks `reminder_schedules` to skip already-sent reminders (idempotency)
3. Sends per-student HTML emails via Resend API
4. Marks `reminder_schedules.status = 'sent'`

Email template: `/emails/session-reminder.tsx` (React Email).

### AI (Claude API)

Called **only** from server-side API routes (`/app/api/research/*`). Never from the browser. Rate-limited to 10 requests/student/hour.

- `lib/anthropic/research-suggest.ts` — phase-level next-step suggestions
- `lib/anthropic/paper-draft.ts` — IEEE paper section drafts from student observations

### Multi-Supervisor Model (Migration 002)

Extends the research module with a full supervision layer:

- **Roles**: `coordinator` (admin), `supervisor` (primary|advisor), `student`
- **`project_supervisors`** — assigns supervisors to projects. Advisors get `tagged_phases int[]` and `tagged_sections text[]` restricting their access.
- **`phase_signoffs`** — one row per phase (UNIQUE). Upsert pattern handles coordinator override.
- **`supervision_comments`** — threaded via `parent_id`. `is_private=true` hides from students.
- **`notifications`** — in-platform + Resend email via `lib/notifications/send.ts`

Permission checks: `lib/roles/permissions.ts` — always call these in Server Actions before mutations.

New routes: `/supervisor/*`, `/coordinator/*` with own layouts.
Components: `components/supervision/` — SignOffModal, SupervisorCard, CommentThread, MeetingNoteForm, QuestionForm.

### Research Lab

Dark-themed module (`--research-bg: #0D0B08`). All other pages use light theme — this contrast is intentional.

Approval workflow: `draft → pending_review → approved | needs_revision`. `is_visible_to_class` flips to `true` only on teacher approval. Students can never query another student's research phases or submissions (enforced by RLS).

IEEE PDF export uses Puppeteer or `@react-pdf/renderer` via `/api/research/export-ieee`.

---

## Design Tokens

```css
--christ-blue:    #1565C0   /* primary */
--christ-saffron: #E8720C   /* accent */
--christ-gold:    #B7791F   /* XP / achievements */
--christ-green:   #1A7A4A   /* success */
--christ-red:     #C0392B   /* alerts */
--christ-bg:      #F7F8FA   /* page background */
--research-bg:    #0D0B08   /* Research Lab dark background */
--research-amber: #F5A623   /* Research Lab accent */
```

Fonts (all via Google Fonts, imported in `app/layout.tsx`):
- `Playfair Display` — display headings
- `Source Serif 4` — body text
- `Courier Prime` — monospace / code / research notes

---

## Deployment

### Vercel

The app deploys to Vercel from the `iot-at-christ/` subdirectory.

**Required GitHub Secrets** (Settings → Secrets → Actions):
```
VERCEL_TOKEN        # from vercel.com → Account Settings → Tokens
VERCEL_ORG_ID       # from .vercel/project.json after `vercel link`
VERCEL_PROJECT_ID   # from .vercel/project.json after `vercel link`
```

**One-time Vercel project setup:**
```bash
cd iot-at-christ
npx vercel link          # links repo, creates .vercel/project.json
npx vercel env pull      # pulls env vars into .env.local
```

**Required Vercel Environment Variables** (set in Vercel dashboard):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
RESEND_API_KEY
ANTHROPIC_API_KEY
NEXT_PUBLIC_APP_URL        # set to your Vercel domain
```

### CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/ci.yml` | Every push/PR | lint → type-check → test |
| `.github/workflows/deploy.yml` | Push to `main` | Quality gate → Vercel **production** |
| `.github/workflows/deploy.yml` | Push to `claude/**` or PR | Quality gate → Vercel **preview** |

Preview deployments automatically comment the URL on the PR.

---

## Memory Management (Token Efficiency)

### Session Start Hook
`.claude/hooks/session-start.sh` runs at the start of every Claude Code session:
1. **Installs dependencies** — `npm install --prefer-offline` (async, cached after first run)
2. **Prints compact context snapshot** — architecture summary, key file paths, role model, deploy info — replaces the need to re-read files
3. **Lists recently modified files** — helps Claude resume in-progress work

Registered in `.claude/settings.json`.

### CLAUDE.md as Memory
This file IS the project memory. When the codebase grows, keep this file updated:
- Add new major features to the Architecture section
- Keep the supervision model table current
- Add new design tokens when added to tailwind.config.ts
- Add new environment variables to the deployment section

### Token-saving rules for Claude
- **Read CLAUDE.md first** before exploring files — it has 90% of what you need
- **Use Grep/Glob** over reading whole directories
- **Read only the specific function you need to modify**, not whole files
- **Never re-read files already in the conversation context**
- The session hook snapshot replaces needing to call `ls` and read layout files at session start

---

## Key Constraints

- **XP awarded once per assignment.** Grade-to-XP map: A+=200, A=170, A-=150, B+=120, B=100, B-=80, C+=60, C=40.
- **Mobile-first.** All grids must collapse at 375px. Student portal must work on Android Chrome.
- **Reminder idempotency.** Always check `reminder_schedules` before sending. Running the Edge Function twice must not produce duplicate emails.
- **No hardcoded subject logic.** `subject_id` is always read from the DB. The `slug` in YAML is the only identifier.
- **Teacher's own research project** (Underwater Acoustic Modem / UWAC) is seeded on first boot under the teacher profile.
