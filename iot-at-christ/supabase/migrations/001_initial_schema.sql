-- IoT at CHRIST — Initial Schema
-- Run: npx supabase db push

-- Enable required extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

-- ─────────────────────────────────────────────
-- Core tables
-- ─────────────────────────────────────────────

create table profiles (
  id                   uuid primary key references auth.users on delete cascade,
  email                text not null unique,
  full_name            text,
  avatar_url           text,
  role                 text not null default 'student' check (role in ('teacher', 'student')),
  google_id            text,
  google_access_token  text,  -- stored encrypted via Supabase Vault in production
  google_refresh_token text,
  created_at           timestamptz default now()
);

create table subjects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  year        text,
  semester    text,
  is_active   boolean default true,
  config      jsonb   -- full parsed YAML content (includes missions)
);

create table units (
  id          uuid primary key default gen_random_uuid(),
  subject_id  uuid references subjects on delete cascade,
  number      integer not null,
  title       text not null,
  description text,
  hours       integer,
  color_hex   text,
  icon        text,
  unique (subject_id, number)
);

create table sessions (
  id                  uuid primary key default gen_random_uuid(),
  unit_id             uuid references units on delete cascade,
  number              integer not null,
  title               text not null,
  hours               integer,
  topics              jsonb,
  keywords            jsonb,
  case_study          jsonb,
  tools               jsonb,
  assignment          jsonb,
  no_hw_alternative   text,
  scheduled_at        timestamptz,
  unique (unit_id, number)
);

-- ─────────────────────────────────────────────
-- Student activity
-- ─────────────────────────────────────────────

create table enrollments (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid references profiles on delete cascade,
  subject_id            uuid references subjects on delete cascade,
  classroom_course_id   text,
  enrolled_at           timestamptz default now(),
  unique (student_id, subject_id)
);

create table assignment_submissions (
  id                              uuid primary key default gen_random_uuid(),
  session_id                      uuid references sessions on delete cascade,
  student_id                      uuid references profiles on delete cascade,
  status                          text default 'pending' check (status in ('pending', 'submitted', 'graded')),
  grade                           text,
  feedback                        text,
  xp_awarded                      integer,
  google_classroom_submission_id  text,
  submitted_at                    timestamptz,
  graded_at                       timestamptz,
  unique (session_id, student_id)
);

create table student_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid references profiles on delete cascade,
  session_id   uuid references sessions on delete cascade,
  completed    boolean default false,
  xp           integer default 0,
  completed_at timestamptz,
  unique (student_id, session_id)  -- enforces XP awarded only once
);

-- ─────────────────────────────────────────────
-- Forum
-- ─────────────────────────────────────────────

create table forum_posts (
  id               uuid primary key default gen_random_uuid(),
  subject_id       uuid references subjects on delete cascade,
  author_id        uuid references profiles,
  title            text not null,
  body             text,
  tags             text[],
  is_pinned        boolean default false,
  is_announcement  boolean default false,
  likes            integer default 0,
  created_at       timestamptz default now()
);

create table forum_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references forum_posts on delete cascade,
  author_id  uuid references profiles,
  body       text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Research Lab
-- ─────────────────────────────────────────────

create table research_projects (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid references profiles,
  subject_id            uuid references subjects,
  title                 text,
  domain                text,
  target_venue          text,
  abstract              text,
  tags                  text[],
  approval_status       text default 'draft' check (
                          approval_status in ('draft','pending_review','approved','needs_revision')
                        ),
  teacher_feedback      text,
  is_visible_to_class   boolean default false,  -- only true after teacher approval
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create table research_phases (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid references research_projects on delete cascade,
  number               integer,
  title                text,
  description          text,
  planned_outcome      text,
  status               text default 'planned' check (status in ('planned','in-progress','completed')),
  trl                  integer,
  budget_inr           integer default 0,
  student_observation  text,
  ai_suggestions       jsonb,
  linked_assignment_id uuid references assignment_submissions,
  completed_at         timestamptz
);

create table paper_sections (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references research_projects on delete cascade,
  section_type text,  -- 'abstract', 'methodology', 'related_work', etc.
  content      text,
  "order"      integer,
  updated_at   timestamptz default now(),
  unique (project_id, section_type)
);

-- ─────────────────────────────────────────────
-- Reminder system
-- ─────────────────────────────────────────────

create table reminder_schedules (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references sessions,
  student_id uuid references profiles,
  status     text default 'pending' check (status in ('pending','sent','failed')),
  created_at timestamptz default now(),
  unique (session_id, student_id)  -- idempotency guard — prevents duplicate sends
);

-- ─────────────────────────────────────────────
-- Operational logs
-- ─────────────────────────────────────────────

create table sync_log (
  id            uuid primary key default gen_random_uuid(),
  teacher_id    uuid references profiles,
  student_count integer,
  grade_count   integer,
  status        text,
  errors        jsonb,
  created_at    timestamptz default now()
);

create table ai_usage_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles,
  endpoint   text,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table profiles             enable row level security;
alter table subjects             enable row level security;
alter table units                enable row level security;
alter table sessions             enable row level security;
alter table enrollments          enable row level security;
alter table assignment_submissions enable row level security;
alter table student_progress     enable row level security;
alter table forum_posts          enable row level security;
alter table forum_replies        enable row level security;
alter table research_projects    enable row level security;
alter table research_phases      enable row level security;
alter table paper_sections       enable row level security;
alter table reminder_schedules   enable row level security;
alter table sync_log             enable row level security;
alter table ai_usage_log         enable row level security;

-- Profiles: anyone can read, only self can update
create policy "profiles_read_all"   on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Subjects/units/sessions: any authenticated user can read
create policy "subjects_read"  on subjects  for select using (auth.role() = 'authenticated');
create policy "units_read"     on units     for select using (auth.role() = 'authenticated');
create policy "sessions_read"  on sessions  for select using (auth.role() = 'authenticated');

-- Teacher can write subjects/units/sessions
create policy "subjects_teacher_write" on subjects for all
  using ((select role from profiles where id = auth.uid()) = 'teacher');
create policy "units_teacher_write"    on units    for all
  using ((select role from profiles where id = auth.uid()) = 'teacher');
create policy "sessions_teacher_write" on sessions for all
  using ((select role from profiles where id = auth.uid()) = 'teacher');

-- Submissions: student reads own, teacher reads all + updates
create policy "submissions_student_own" on assignment_submissions for select
  using (student_id = auth.uid());
create policy "submissions_student_insert" on assignment_submissions for insert
  with check (student_id = auth.uid());
create policy "submissions_teacher_all" on assignment_submissions for all
  using ((select role from profiles where id = auth.uid()) = 'teacher');

-- Progress: student reads/writes own, teacher reads all
create policy "progress_student_own" on student_progress for all
  using (student_id = auth.uid());
create policy "progress_teacher_read" on student_progress for select
  using ((select role from profiles where id = auth.uid()) = 'teacher');

-- Forum: any authenticated user can read + insert, teacher can update/delete
create policy "forum_posts_read"    on forum_posts for select using (auth.role() = 'authenticated');
create policy "forum_posts_insert"  on forum_posts for insert with check (author_id = auth.uid());
create policy "forum_posts_teacher" on forum_posts for update
  using ((select role from profiles where id = auth.uid()) = 'teacher');
create policy "forum_replies_read"   on forum_replies for select using (auth.role() = 'authenticated');
create policy "forum_replies_insert" on forum_replies for insert with check (author_id = auth.uid());

-- Research: owner full access, teacher reads all + writes feedback, approved visible to students
create policy "research_owner" on research_projects for all using (owner_id = auth.uid());
create policy "research_teacher_read" on research_projects for select
  using ((select role from profiles where id = auth.uid()) = 'teacher');
create policy "research_teacher_feedback" on research_projects for update
  using ((select role from profiles where id = auth.uid()) = 'teacher');
create policy "research_approved_visible" on research_projects for select
  using (is_visible_to_class = true and auth.role() = 'authenticated');

-- Research phases: owner full, teacher read
create policy "phases_owner"   on research_phases for all  using (
  (select owner_id from research_projects where id = project_id) = auth.uid()
);
create policy "phases_teacher" on research_phases for select
  using ((select role from profiles where id = auth.uid()) = 'teacher');

-- Paper sections: owner full, teacher read
create policy "paper_owner"   on paper_sections for all using (
  (select owner_id from research_projects where id = project_id) = auth.uid()
);
create policy "paper_teacher" on paper_sections for select
  using ((select role from profiles where id = auth.uid()) = 'teacher');
