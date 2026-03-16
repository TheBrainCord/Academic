-- IoT at CHRIST — Multi-Supervisor Model
-- Adds coordinator/supervisor roles + full supervision layer on top of existing research tables

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
