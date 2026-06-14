-- Simulator telemetry — lightweight usage log for the Virtual Lab / Sketch
-- Runner so teachers and coordinators can see who's trying it and how.
-- Run: npx supabase db push

create table simulator_events (
  id          uuid primary key default gen_random_uuid(),
  event_type  text not null check (event_type in ('lab_view', 'sign_in', 'challenge_completed', 'sketch_run')),
  session_id  text not null,
  user_id     uuid references profiles on delete set null,
  path        text,
  board_id    text,
  challenge_id text,
  metadata    jsonb,
  created_at  timestamptz default now()
);

create index simulator_events_created_at_idx on simulator_events (created_at desc);
create index simulator_events_user_id_idx on simulator_events (user_id);

alter table simulator_events enable row level security;

-- Anyone (including anonymous Virtual Lab visitors) can record an event.
create policy "simulator_events_insert_anyone" on simulator_events
  for insert with check (true);

-- Only teachers/coordinators can read the log.
create policy "simulator_events_read_staff" on simulator_events
  for select using (
    (select role from profiles where id = auth.uid()) in ('teacher', 'coordinator')
  );
