# IoT at CHRIST — Claude Code Instructions

## Project identity

Open-source academic platform for Christ University M.Tech CSE IoT.
Maintained by Ravesh Ashok Naik, TheBrainCord, Kumta.
Two modules: Course Platform + Research Lab (ResearchFlow).

## Stack — NEVER suggest alternatives

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS
- Backend: Supabase (Postgres, Auth, Edge Functions, Storage)
- Email: Resend with React Email templates
- AI: Anthropic claude-sonnet-4-20250514 (server-side only, never client)
- Auth: Google OAuth via Supabase Auth
- External: Google Classroom API (read-only)
- Deploy: Vercel (frontend) + Supabase cloud

## Hard rules — never break these

1. All DB queries in Server Components or Server Actions only.
   Never expose SUPABASE_SERVICE_ROLE_KEY to client.
2. Claude API called only from /app/api/ routes. Rate limit: 10 req/student/hour.
3. Google Classroom integration is READ-ONLY. Never write to Classroom.
4. Reminder emails are idempotent — check reminder_schedules before sending.
5. Research projects private by default. Only teacher approval makes them visible.
6. RLS on every table. A student must never read another student's research data.
7. Mobile-first CSS. All layouts must work at 375px viewport.
8. No alternative libraries. If something isn't in the stack above, ask before adding.

## Code style

- TypeScript strict mode always
- Named exports only (no default exports except pages and layouts)
- Server Components by default; add 'use client' only when necessary
- Zod for all external data validation (API responses, YAML parsing)
- Error boundaries on every page — never let a page white-screen
- Every non-obvious decision gets a comment explaining why

## Colour tokens (Christ brand)

--christ-navy: #1B2E4B
--christ-saffron: #E8720C
--christ-gold: #B7791F
--christ-green: #1A7A4A
--research-bg: #0D0B08 (Research Lab dark theme only)
--research-amber: #F5A623

## Fonts

Display: Playfair Display
Body: Source Serif 4
Mono: Courier Prime
Import all three in layout.tsx.

## File structure

See SCHEMA.md for database. See TODO.md for current task.
Key paths:
/content/subjects/iot.yaml — full syllabus content
/scripts/seed-subjects.ts — seeds YAML to Supabase
/supabase/functions/ — Edge Functions
/emails/ — React Email templates
