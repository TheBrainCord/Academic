# Current work — Session focus

## STATUS: Building Step 12 (Polish, mobile, README)

Steps 1–11 are complete and working. Do not rebuild them.

## THIS SESSION — complete these in order

### Task 1: Mobile responsiveness audit

Check and fix these pages on small screens (≤ 375px):
- /teacher/curriculum — session list and session detail should stack vertically
- /teacher/students — ClassroomSyncStatus bar should wrap gracefully
- /student/research/[id] — PhaseCard and PaperEditor sections should scroll without overflow
- /teacher/research/[id] — feedback form should not overflow horizontally

Rule: no horizontal scroll on any page at 375px viewport width.

### Task 2: Supabase Storage bucket for PDF exports

The research paper PDF export route exists at /app/api/research/export-ieee/route.ts but
the Supabase Storage bucket it writes to ("research-pdfs") is not provisioned.
Add a Supabase migration to create it:

```sql
insert into storage.buckets (id, name, public)
values ('research-pdfs', 'research-pdfs', false);

-- Only the project owner can read/write their own PDFs
create policy "pdf_owner" on storage.objects
  for all using (
    bucket_id = 'research-pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

File: /supabase/migrations/004_storage_buckets.sql

### Task 3: Leaderboard — wire real XP

/app/student/leaderboard/page.tsx currently exists. Verify it reads from
student_progress.xp (sum per student) grouped by student_id, ordered DESC.
If it is using a stub or hardcoded data, replace with a real Supabase query.

### Task 4: README.md

Create /iot-at-christ/README.md with:
- One-paragraph project description
- Tech stack table (Next.js 14, Supabase, Google Classroom API, Resend, Claude API)
- Local setup steps (clone → cp .env.example .env.local → fill vars → npm install → npm run dev)
- Required environment variables table (name + description for each)
- Deployment section: "Connect repo to Vercel, add secrets to GitHub, push to main"
- Link to Supabase migration instructions (npx supabase db push)

### Task 5: .env.example

Create /iot-at-christ/.env.example with all required variable names and
placeholder values. This file IS safe to commit — it contains no real secrets.

## NEXT SESSION (do not start these yet)

- Step 13: End-to-end testing with real Classroom course
  - Teacher login → Sync → verify roster appears with Invited badges
  - Student login → submit assignment → teacher grades → XP awarded
  - Research project create → phase complete → AI draft triggered
- Step 14: Production checklist before go-live
  - Enable Supabase Vault for google_access_token / google_refresh_token encryption
  - Set up Resend domain verification for @christuniversity.in
  - Configure Vercel environment variables for production

## BLOCKED — do not touch

- Puppeteer PDF export — needs Supabase paid plan for Edge Function memory
  (the export-ieee route exists but the Edge Function body is a stub)
