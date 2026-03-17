# Build progress

## Completed (do not rebuild)

- [x] Step 1: Project scaffold, Tailwind config, fonts imported
- [x] Step 2: Supabase schema, all migrations run (001 initial, 002 supervision model,
      003 pg_cron reminder schedule), RLS policies active
- [x] Step 3: Auth — Google OAuth login, callback, middleware, role-based redirect
- [x] Step 4: Content system — iot.yaml complete (7 units, 25 sessions, 5 missions),
      seed script working, all content in Supabase
- [x] Step 5: Teacher curriculum + dashboard pages
- [x] Step 6: Student dashboard, lessons, assignment submission form
- [x] Step 7: Google Classroom integration
      - /lib/google/classroom.ts — getCourseRoster, getCourseAssignments, getStudentGrades
      - /supabase/functions/sync-classroom/index.ts — idempotent sync Edge Function
      - /app/api/classroom/sync/route.ts — POST endpoint with 5-min rate limit
      - /components/teacher/ClassroomSyncStatus.tsx — sync button + last-synced display
- [x] Step 8: Reminder emails
      - /emails/session-reminder.tsx — React Email template
      - /supabase/functions/send-session-reminders/index.ts — Edge Function
      - /supabase/migrations/003_cron_reminders.sql — pg_cron hourly schedule
- [x] Step 9: Missions pages
      - /app/student/missions/page.tsx — grid of mission cards from subject config
      - /app/student/missions/[id]/page.tsx — mission detail (situation, challenge, deliverables)
- [x] Step 10: Assignments + Forum
      - /components/teacher/GradingPanel.tsx — teacher grades submissions, awards XP
      - /app/teacher/assignments/page.tsx — teacher grading view
      - /app/student/assignments/page.tsx — student submission view
      - /components/student/NewPostButton.tsx — modal form to create forum posts
      - /app/student/forum/page.tsx — forum list + NewPostButton wired in
      - /app/teacher/forum/page.tsx — teacher forum view with pin/announce controls
- [x] Step 11: Research Lab
      - /components/research/IdeaExplorer.tsx — AI-powered idea generation
      - /components/research/PhaseCard.tsx — phase tracker with AI suggestions
      - /components/research/PaperEditor.tsx — section-by-section paper editor
      - /app/student/research/page.tsx — my project + class board
      - /app/student/research/[id]/page.tsx — project workspace (phases + paper)
      - /app/teacher/research/page.tsx — awaiting review + class board
      - /app/teacher/research/[id]/page.tsx — teacher review + feedback form
      - /app/api/research/* — AI draft, AI suggest, idea explore, IEEE export routes
- [x] Multi-supervisor model (coordinator + supervisor roles)
      - /app/coordinator/* — dashboard, students, supervisors pages
      - /app/supervisor/* — dashboard, onboarding, project view pages
      - /supabase/migrations/002_supervision_model.sql
      - /lib/roles/permissions.ts — role-based access helpers (24 unit tests)
- [x] CI/CD + Vercel deployment
      - /.github/workflows/ci.yml — lint + type-check + test on every push
      - /.github/workflows/deploy.yml — production on main, preview on claude/**
      - /iot-at-christ/vercel.json — Vercel project config
      - /iot-at-christ/next.config.js — standalone output, image domains

## In progress (current session: Step 12)

- [x] Mobile responsiveness audit — DONE (5 fixes: students table hidden email col, header stacks, ClassroomSyncStatus flex-wrap, curriculum/research/student-research headings responsive)
- [ ] Migration 004: Supabase Storage bucket for research-pdfs — NOT STARTED
- [x] Leaderboard: verify real XP query — VERIFIED (reads student_progress.xp, sums per student, sorted DESC)
- [ ] README.md — NOT STARTED
- [ ] .env.example — NOT STARTED

## Known issues (fixed)

- ~~Timezone bug in SessionScheduler~~ — fixed: uses date-fns-tz formatInTimeZone/fromZonedTime
  to keep datetime-local input in IST at all times

## Known issues (open)

- Supabase Storage bucket "research-pdfs" not provisioned (migration 004 task above)
- Puppeteer PDF export Edge Function body is a stub — needs paid Supabase plan
- google_access_token / google_refresh_token stored in plaintext — needs Supabase Vault in prod

## Environment

- Local dev: running on port 3000, Supabase project: iot-at-christ-dev
- Test teacher account: ravesh@tbc.edu (Google OAuth)
- Test student account: test.student@mtech.christuniversity.in
- Classroom test course ID: 123456789 (Ravesh's test classroom)
