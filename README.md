# IoT at CHRIST

An open-source academic platform for university IoT programmes. Built for Christ University's M.Tech/MSc CSE curriculum — freely adaptable for any institution.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

---

## Features

- **Story-driven IoT missions** — gamified lab sessions across four domains: Defence, Healthcare, Smart City, Agriculture
- **Research Lab** — students draft IEEE-format papers with AI-assisted section generation and export
- **Multi-supervisor model** — coordinators assign multiple supervisors per research project; supervisors track progress, add meeting notes, and sign off phases
- **Google Classroom sync** — roster import and grade push via OAuth
- **Automated reminders** — email notifications 24h before each session (powered by Resend)
- **Role-based access** — Student / Supervisor / Coordinator roles with fine-grained permissions
- **Extensible subjects** — add any course by dropping a single YAML file; no code changes required

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + Radix UI |
| Database | Supabase (PostgreSQL + Auth) |
| Email | Resend |
| Classroom | Google Classroom API |
| AI (Research Lab) | Anthropic Claude API |

## Project Structure

```
iot-at-christ/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── classroom/      # Google Classroom sync
│   │   ├── reminders/      # Email reminder triggers
│   │   └── research/       # AI paper drafting & idea exploration
│   ├── student/            # Student-facing pages
│   ├── supervisor/         # Supervisor dashboard & project view
│   └── coordinator/        # Coordinator management pages
├── components/             # Shared React components
│   ├── research/           # Research lab UI
│   └── supervision/        # Comments, meeting notes, sign-off
├── content/subjects/       # YAML subject definitions
├── lib/                    # Server-side utilities
│   ├── anthropic/          # Claude API wrappers
│   ├── notifications/      # Email sending
│   └── roles/              # Permission helpers
├── supabase/migrations/    # Database schema (SQL)
└── types/                  # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) project with Classroom API enabled
- A [Resend](https://resend.com) account for email
- An [Anthropic](https://console.anthropic.com) API key (for the research lab feature)

### 1. Clone and install

```bash
git clone https://github.com/ranaik09/Academic.git
cd Academic/iot-at-christ
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth + Classroom
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Resend (email)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="IoT at CHRIST <reminders@yourdomain.com>"

# Anthropic (AI Research Lab)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Run migrations in order from the Supabase SQL editor or via the CLI:

```bash
# Using Supabase CLI
supabase db push
```

Or run the SQL files manually from `supabase/migrations/`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding a New Subject

Drop a `.yaml` file in `content/subjects/` and run:

```bash
npm run seed
```

No code changes needed. See `content/subjects/` for an example schema.

## Roles

| Role | Access |
|---|---|
| **Student** | Missions, Research Lab, Forum, Leaderboard |
| **Supervisor** | Assigned projects, meeting notes, phase sign-off |
| **Coordinator** | All students, supervisor assignments, full oversight |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript checks
npm test             # Run tests (Vitest)
npm run seed         # Seed subjects from YAML files
```

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — free to use, fork, and deploy at any university.

---

Built by [Ravesh Ashok Naik](https://github.com/ranaik09)
