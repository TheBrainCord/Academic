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

## Key Constraints

- **XP awarded once per assignment.** Grade-to-XP map: A+=200, A=170, A-=150, B+=120, B=100, B-=80, C+=60, C=40.
- **Mobile-first.** All grids must collapse at 375px. Student portal must work on Android Chrome.
- **Reminder idempotency.** Always check `reminder_schedules` before sending. Running the Edge Function twice must not produce duplicate emails.
- **No hardcoded subject logic.** `subject_id` is always read from the DB. The `slug` in YAML is the only identifier.
- **Teacher's own research project** (Underwater Acoustic Modem / UWAC) is seeded on first boot under the teacher profile.

---

## Git Workflow

- **Never commit or push directly to `main`.** Every change — features, fixes, even small tweaks — goes on its own new branch (e.g. `claude/<short-description>-<id>`).
- After pushing the branch, **open a pull request into `main`** describing the change and a test plan.
- Only merge a PR when the user explicitly asks for it.
