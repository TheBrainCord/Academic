# Deployment — Vercel project `christ-iot`

| | |
|---|---|
| Team | `team_URqZRmRvZO7Ygq36M79rat8b` (TheBrainCord) |
| Project | `christ-iot` — `prj_XQ6qADRzJHz6ci64HBaBl3OSkIc1` |
| Pipeline | `.github/workflows/deploy.yml` (repo root) |

## How the pipeline works

- **Every pull request** → unit tests + build, then a **preview deployment** (unique URL per PR).
- **Push to `main`** → tests + build, then a **production deployment**.
- **Manual** → Actions tab → "Deploy to Vercel" → Run workflow (choose preview/production).

The deploy uses the Vercel CLI `pull → build → deploy --prebuilt` flow, so the
build runs in GitHub Actions and Vercel only receives the finished output.

## One-time setup checklist

1. **GitHub secret** — repo Settings → Secrets and variables → Actions → New secret:
   - `VERCEL_TOKEN`: create at <https://vercel.com/account/tokens> with access
     to the TheBrainCord team. This is the only secret the workflow needs —
     the org and project IDs are plain identifiers committed in the workflow.

2. **Vercel project settings** (<https://vercel.com> → christ-iot → Settings):
   - **Root Directory**: `iot-at-christ` (the app lives in a subfolder of the repo).
   - **Framework Preset**: Next.js (auto-detected; also pinned in `vercel.json`).
   - Install command comes from `iot-at-christ/vercel.json`
     (`npm install --legacy-peer-deps` — needed because `@react-email/components`
     pins React 18 peer deps while the app runs React 19).

3. **Environment variables** (Vercel → christ-iot → Settings → Environment Variables).
   Copy from `.env.local.example`; mark the first two for all environments,
   keep the server-only keys out of `NEXT_PUBLIC_*`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — never exposed to the browser)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLASSROOM_SCOPE`
   - `RESEND_API_KEY`, `EMAIL_FROM`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (the production domain), `NEXT_PUBLIC_APP_NAME`

4. **Google OAuth redirect** — add the Vercel production domain (and the
   `*.vercel.app` preview pattern if you want OAuth on previews) to the
   authorized redirect URIs in Google Cloud Console, and to the Supabase Auth
   redirect allow-list.

## Notes

- The type-check step in CI is currently **non-blocking**: `types/database.ts`
  is stale against supabase-js v2.101 (~300 pre-existing errors). Regenerate with
  `npx supabase gen types typescript --project-id <id> > types/database.ts`,
  then make the step blocking by removing `continue-on-error` in the workflow.
- Supabase Edge Functions (`supabase/functions/*`) deploy separately via
  `npx supabase functions deploy` — they are not part of the Vercel pipeline.
- Forked PRs skip deployment (no access to `VERCEL_TOKEN`); they still run tests.
