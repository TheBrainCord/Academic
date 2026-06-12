# Build progress

## Virtual Lab — Phase 1 (current)

- [x] Shared contract: types/simulator.ts (boards, components, circuit, validation, simulation)
- [x] Engine: lib/simulator/{boards,components,validation,simulation}.ts + vitest suite
      — Arduino Uno / ESP32 DevKit / Raspberry Pi 4, 10 components,
      connection-testing rules (power, ground, ADC-on-Pi, LED resistor, shorts,
      voltage compatibility), deterministic fake telemetry + serial monitor
- [x] UI: /student/simulator — tap-to-connect wiring on an SVG workbench,
      live validation panel, serial monitor, readings panel, localStorage persistence
- [x] Research Idea Bank: /student/research-ideas — curated academic IoT project
      ideas (types/research-ideas.ts + content/research-ideas/ideas.ts), domain &
      difficulty filters, links into Virtual Lab and Research Lab
- [x] Student nav: added Virtual Lab + Idea Bank
- [x] Phase 2a: guided wiring challenges — 6 auto-checked exercises
      (lib/simulator/challenges.ts + ChallengePanel), live requirement
      checklist, completions persisted in localStorage
- [ ] Phase 2 remaining: saving benches to Supabase, code-block simulation
      (student writes pseudo-sketch), MCP3008 ADC module for the Pi,
      per-session challenge ↔ syllabus links

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
