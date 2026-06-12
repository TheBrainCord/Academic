# Supabase setup — project `buenkrsopqnhpysgsvog`

The Supabase project behind IoT at CHRIST is
**`buenkrsopqnhpysgsvog`** → base URL `https://buenkrsopqnhpysgsvog.supabase.co`.
Follow the steps in order; step 4 is the block you paste into Vercel.

## 1. Apply the database schema

Open <https://supabase.com/dashboard/project/buenkrsopqnhpysgsvog/sql/new>
and run the two migration files **in this order** (paste the full file
contents, run, then the next):

1. `iot-at-christ/supabase/migrations/001_initial_schema.sql`
2. `iot-at-christ/supabase/migrations/002_supervision_model.sql`

Or with the CLI from `iot-at-christ/`:

```bash
npx supabase link --project-ref buenkrsopqnhpysgsvog
npx supabase db push
```

> Note: `001` enables the `pg_cron` extension. If the SQL editor rejects it,
> enable pg_cron first under Database → Extensions, then re-run.

## 2. Get your API keys

Dashboard → Project Settings → **API**
(<https://supabase.com/dashboard/project/buenkrsopqnhpysgsvog/settings/api>):

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret — server only)

## 3. Configure auth redirects

Dashboard → Authentication → **URL Configuration**:

- **Site URL**: your production domain (e.g. `https://christ-iot.vercel.app`)
- **Redirect URLs**: add
  - `https://christ-iot.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (local dev)
  - `https://*-thebraincord.vercel.app/auth/callback` (PR previews, optional)

Then Authentication → Providers → **Google**: enable it and paste the Google
OAuth client ID/secret (the same ones used below). In Google Cloud Console,
add `https://buenkrsopqnhpysgsvog.supabase.co/auth/v1/callback` as an
authorized redirect URI.

## 4. Paste into Vercel → christ-iot → Settings → Environment Variables

Copy this block into Vercel's "Import .env" box (Settings → Environment
Variables → paste), then fill in each `<...>` from steps 2–3. Apply to
**Production** (and Preview if you want previews functional):

```env
NEXT_PUBLIC_SUPABASE_URL=https://buenkrsopqnhpysgsvog.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from step 2>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from step 2>

GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
NEXT_PUBLIC_GOOGLE_CLASSROOM_SCOPE="https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly"

RESEND_API_KEY=<from resend.com — optional until reminder emails go live>
EMAIL_FROM="IoT at CHRIST <reminders@iotchrist.edu>"

ANTHROPIC_API_KEY=<from console.anthropic.com — powers Research Lab AI>

NEXT_PUBLIC_APP_URL=https://christ-iot.vercel.app
NEXT_PUBLIC_APP_NAME="IoT at CHRIST"
```

Minimum to get past the setup screen: the two `NEXT_PUBLIC_SUPABASE_*` values.
Everything else unlocks login (Google), Classroom sync, emails and AI features.

## 5. Redeploy and verify

1. Vercel → christ-iot → Deployments → ⋯ on the latest → **Redeploy**
   (`NEXT_PUBLIC_*` values are baked in at build time, so a redeploy is required).
2. Visit the site — the `/setup` notice should be gone and `/auth/login` should load.
3. Sign in with Google, then check the role redirect works.

## 6. Seed the course content (one-time, from your machine)

```bash
cd iot-at-christ
cp .env.local.example .env.local   # fill in the same values as step 4
npm install --legacy-peer-deps
npm run seed                        # pushes content/subjects/iot.yaml into Supabase
```

## 7. Regenerate DB types (clears ~300 known type errors)

```bash
npx supabase gen types typescript --project-id buenkrsopqnhpysgsvog > types/database.ts
```

Commit the result, then remove `continue-on-error` from the type-check step in
`.github/workflows/deploy.yml` to make type-checking a hard CI gate.
