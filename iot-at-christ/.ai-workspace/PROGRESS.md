# Build progress

## Completed (do not rebuild)

- [x] Step 1: Project scaffold, Tailwind config, fonts imported
- [x] Step 2: Supabase schema, all migrations run, RLS policies active
- [x] Step 3: Auth — Google OAuth login, callback, middleware, role-based redirect
- [x] Step 4: Content system — iot.yaml complete (7 units, 25 sessions, 5 missions),
      seed script working, all content in Supabase
- [x] Step 5: Teacher curriculum + dashboard pages
- [x] Step 6: Student dashboard, lessons, assignment submission form

## In progress (current session: Step 7)

- [ ] /lib/google/classroom.ts — NOT STARTED
- [ ] sync-classroom Edge Function — NOT STARTED
- [ ] /app/api/classroom/sync — NOT STARTED
- [ ] Sync UI on /teacher/students — NOT STARTED

## Known issues (fix before moving forward)

- Session scheduling UI has a timezone bug: scheduled_at saves in UTC but
  displays in UTC on the teacher's screen. Fix: use date-fns-tz to display
  in 'Asia/Kolkata' timezone everywhere.
- Supabase Storage bucket for PDF exports not created yet — needed for Step 11.

## Not started

- Step 8: Reminder emails
- Step 9: Missions pages
- Step 10: Assignments + Forum
- Step 11: Research Lab
- Step 12: Polish, mobile, README

## Environment

- Local dev: running on port 3000, Supabase project: iot-at-christ-dev
- Test teacher account: ravesh@tbc.edu (Google OAuth)
- Test student account: test.student@mtech.christuniversity.in
- Classroom test course ID: 123456789 (Ravesh's test classroom)

```

---

## How to use these files in practice

**Before starting a session**, open `TODO.md` and read your own notes from last time. Then open Claude Code and say:
```

Read CLAUDE.md, SCHEMA.md, and TODO.md first.
Then build Task 1 from TODO.md.
