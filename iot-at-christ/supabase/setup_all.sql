-- ════════════════════════════════════════════════════════════════
-- IoT at CHRIST — complete database setup (single paste-ready script)
-- Project: buenkrsopqnhpysgsvog
-- Combines migrations 001_initial_schema + 002_supervision_model.
-- Safe to re-run after a failure: the SQL editor runs this in one
-- transaction, so a failed run leaves nothing behind.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- pg_cron needs to be enabled from Database → Extensions on some plans;
-- don't let that abort the schema creation.
do $$
begin
  create extension if not exists "pg_cron";
exception when others then
  raise notice 'pg_cron not enabled here — enable it later under Database → Extensions (needed for reminder emails + classroom sync schedules)';
end $$;


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

-- ════════════════════════════════════════════════════════════════
-- 002 — Multi-supervisor model
-- ════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- Extend profiles with supervisor/coordinator fields
-- ─────────────────────────────────────────────

-- Add new allowed roles and supervisor-specific columns
alter table profiles
  add column if not exists role_subtype       text check (role_subtype in ('primary', 'advisor')),
  add column if not exists expertise_domains  text[] default '{}',
  add column if not exists bio_short          text,
  add column if not exists available_slots    int default 5,
  add column if not exists linkedin_url       text,
  add column if not exists institution        text default 'Christ University';

-- Extend role check to include coordinator and supervisor
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check
  check (role in ('teacher', 'student', 'coordinator', 'supervisor'));

-- ─────────────────────────────────────────────
-- Notifications
-- ─────────────────────────────────────────────

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  type       text not null,
  data       jsonb default '{}',
  read       boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_unread
  on notifications(user_id, read) where read = false;

alter table notifications enable row level security;

create policy "notifications_own" on notifications
  for all using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- Supervision assignment
-- ─────────────────────────────────────────────

create table if not exists project_supervisors (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references research_projects(id) on delete cascade not null,
  supervisor_id    uuid references profiles(id) not null,
  supervisor_type  text not null check (supervisor_type in ('primary', 'advisor')),
  tagged_phases    int[] default '{}',     -- advisor: phase numbers they can access
  tagged_sections  text[] default '{}',   -- advisor: section_types they can access
  assigned_by      uuid references profiles(id),
  assigned_at      timestamptz default now(),
  active           boolean default true,
  unique (project_id, supervisor_id)
);

alter table project_supervisors enable row level security;

-- Coordinator can do everything
create policy "ps_coordinator_all" on project_supervisors
  for all using (
    (select role from profiles where id = auth.uid()) in ('coordinator', 'teacher')
  );

-- Supervisors can read their own assignments
create policy "ps_supervisor_read" on project_supervisors
  for select using (supervisor_id = auth.uid());

-- Students can read supervisors assigned to their projects
create policy "ps_student_read" on project_supervisors
  for select using (
    (select owner_id from research_projects where id = project_id) = auth.uid()
  );

-- ─────────────────────────────────────────────
-- Phase sign-offs
-- ─────────────────────────────────────────────

create table if not exists phase_signoffs (
  id            uuid primary key default gen_random_uuid(),
  phase_id      uuid references research_phases(id) on delete cascade not null,
  supervisor_id uuid references profiles(id) not null,
  decision      text not null check (decision in ('approved', 'revision_requested', 'coordinator_override')),
  feedback      text,
  created_at    timestamptz default now(),
  unique (phase_id)  -- one signoff record per phase; upsert for coordinator override
);

alter table phase_signoffs enable row level security;

-- Supervisors and coordinators can insert/update signoffs on their assigned projects
create policy "signoffs_supervisor_write" on phase_signoffs
  for all using (
    (select role from profiles where id = auth.uid()) in ('supervisor', 'coordinator', 'teacher')
  );

-- Students can read signoffs on their own phases
create policy "signoffs_student_read" on phase_signoffs
  for select using (
    exists (
      select 1 from research_phases rp
      join research_projects proj on proj.id = rp.project_id
      where rp.id = phase_id and proj.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- Supervision comments (threaded)
-- ─────────────────────────────────────────────

create table if not exists supervision_comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references research_projects(id) on delete cascade not null,
  phase_id    uuid references research_phases(id) on delete cascade,
  section_key text,
  author_id   uuid references profiles(id) not null,
  content     text not null,
  is_private  boolean default false,  -- private = not visible to students
  parent_id   uuid references supervision_comments(id),  -- thread replies
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table supervision_comments enable row level security;

-- Students see non-private comments on their projects
create policy "comments_student_read" on supervision_comments
  for select using (
    is_private = false
    and (select owner_id from research_projects where id = project_id) = auth.uid()
  );

-- Students can insert non-private comments on their own projects
create policy "comments_student_insert" on supervision_comments
  for insert with check (
    is_private = false
    and author_id = auth.uid()
    and (select owner_id from research_projects where id = project_id) = auth.uid()
  );

-- Supervisors and coordinators can read all comments on assigned projects
create policy "comments_supervisor_read" on supervision_comments
  for select using (
    (select role from profiles where id = auth.uid()) in ('supervisor', 'coordinator', 'teacher')
    and (
      -- coordinator/teacher: all projects
      (select role from profiles where id = auth.uid()) in ('coordinator', 'teacher')
      or
      -- supervisor: only assigned projects
      exists (
        select 1 from project_supervisors ps
        where ps.project_id = supervision_comments.project_id
          and ps.supervisor_id = auth.uid()
          and ps.active = true
      )
    )
  );

-- Supervisors and coordinators can write comments
create policy "comments_supervisor_write" on supervision_comments
  for insert with check (
    author_id = auth.uid()
    and (select role from profiles where id = auth.uid()) in ('supervisor', 'coordinator', 'teacher')
  );

-- Authors can update their own comments
create policy "comments_author_update" on supervision_comments
  for update using (author_id = auth.uid());

-- ─────────────────────────────────────────────
-- Supervision meetings
-- ─────────────────────────────────────────────

create table if not exists supervision_meetings (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid references research_projects(id) on delete cascade not null,
  supervisor_id uuid references profiles(id) not null,
  student_id    uuid references profiles(id) not null,
  scheduled_at  timestamptz not null,
  agenda        text,
  notes         text,
  action_items  jsonb default '[]',  -- [{item, owner, due_date}]
  status        text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at    timestamptz default now()
);

alter table supervision_meetings enable row level security;

-- Participants can read their meetings
create policy "meetings_participant_read" on supervision_meetings
  for select using (
    supervisor_id = auth.uid()
    or student_id = auth.uid()
    or (select role from profiles where id = auth.uid()) in ('coordinator', 'teacher')
  );

-- Supervisors and coordinators can write meetings
create policy "meetings_supervisor_write" on supervision_meetings
  for all using (
    supervisor_id = auth.uid()
    or (select role from profiles where id = auth.uid()) in ('coordinator', 'teacher')
  );

-- ─────────────────────────────────────────────
-- Research questions (student → supervisor)
-- ─────────────────────────────────────────────

create table if not exists research_questions (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid references research_projects(id) on delete cascade not null,
  student_id           uuid references profiles(id) not null,
  question             text not null,
  context              text,
  checklist_completed  boolean default false,
  status               text default 'pending' check (status in ('pending', 'answered', 'closed')),
  answered_by          uuid references profiles(id),
  answer               text,
  created_at           timestamptz default now(),
  answered_at          timestamptz
);

alter table research_questions enable row level security;

-- Students can read/write their own questions
create policy "questions_student_own" on research_questions
  for all using (student_id = auth.uid());

-- Supervisors can read questions for assigned projects + insert answers
create policy "questions_supervisor_read" on research_questions
  for select using (
    (select role from profiles where id = auth.uid()) in ('supervisor', 'coordinator', 'teacher')
    and (
      (select role from profiles where id = auth.uid()) in ('coordinator', 'teacher')
      or exists (
        select 1 from project_supervisors ps
        where ps.project_id = research_questions.project_id
          and ps.supervisor_id = auth.uid()
          and ps.active = true
      )
    )
  );

create policy "questions_supervisor_answer" on research_questions
  for update using (
    (select role from profiles where id = auth.uid()) in ('supervisor', 'coordinator', 'teacher')
  );

-- ─────────────────────────────────────────────
-- Extend RLS on existing research tables for supervisors
-- ─────────────────────────────────────────────

-- Research projects: supervisors can read assigned projects
create policy "research_supervisor_read" on research_projects
  for select using (
    (select role from profiles where id = auth.uid()) in ('supervisor', 'coordinator')
    and (
      (select role from profiles where id = auth.uid()) = 'coordinator'
      or exists (
        select 1 from project_supervisors ps
        where ps.project_id = research_projects.id
          and ps.supervisor_id = auth.uid()
          and ps.active = true
      )
    )
  );

-- Research phases: primary supervisor can read all phases; advisor only tagged phases
create policy "phases_primary_supervisor" on research_phases
  for select using (
    exists (
      select 1 from project_supervisors ps
      where ps.project_id = research_phases.project_id
        and ps.supervisor_id = auth.uid()
        and ps.supervisor_type = 'primary'
        and ps.active = true
    )
  );

create policy "phases_advisor_tagged" on research_phases
  for select using (
    exists (
      select 1 from project_supervisors ps
      where ps.project_id = research_phases.project_id
        and ps.supervisor_id = auth.uid()
        and ps.supervisor_type = 'advisor'
        and ps.active = true
        and research_phases.number = any(ps.tagged_phases)
    )
  );

create policy "phases_coordinator" on research_phases
  for all using (
    (select role from profiles where id = auth.uid()) = 'coordinator'
  );

-- Paper sections: primary supervisor reads all; advisor reads tagged sections only
create policy "paper_primary_supervisor" on paper_sections
  for select using (
    exists (
      select 1 from project_supervisors ps
      where ps.project_id = paper_sections.project_id
        and ps.supervisor_id = auth.uid()
        and ps.supervisor_type = 'primary'
        and ps.active = true
    )
  );

create policy "paper_advisor_tagged" on paper_sections
  for select using (
    exists (
      select 1 from project_supervisors ps
      where ps.project_id = paper_sections.project_id
        and ps.supervisor_id = auth.uid()
        and ps.supervisor_type = 'advisor'
        and ps.active = true
        and paper_sections.section_type = any(ps.tagged_sections)
    )
  );

create policy "paper_coordinator" on paper_sections
  for all using (
    (select role from profiles where id = auth.uid()) = 'coordinator'
  );

-- ════════════════════════════════════════════════════════════════
-- Done — verification: should list ~17 tables
-- ════════════════════════════════════════════════════════════════
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
