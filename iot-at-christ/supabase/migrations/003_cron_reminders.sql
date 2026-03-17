-- IoT at CHRIST — pg_cron: automated session reminder emails
-- Runs the send-session-reminders Edge Function every hour via pg_cron.
-- pg_cron is enabled in migration 001 (create extension if not exists "pg_cron").

-- Schedule: every hour at :00 — the Edge Function queries for sessions whose
-- scheduled_at is in the 23h–25h window from now, so running hourly is accurate
-- to within one hour for a 24h-before reminder.

select cron.schedule(
  'send-session-reminders',            -- job name (idempotent: same name = update)
  '0 * * * *',                         -- every hour
  $$
    select net.http_post(
      url      := current_setting('app.supabase_url') || '/functions/v1/send-session-reminders',
      headers  := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'),
        'Content-Type',  'application/json'
      ),
      body     := '{}'::jsonb
    );
  $$
);

-- Note: set app.supabase_url and app.supabase_service_role_key in Supabase project settings
-- under Settings → Database → Database settings → Custom config, or via:
--   alter database postgres set app.supabase_url = 'https://your-project.supabase.co';
--   alter database postgres set app.supabase_service_role_key = 'your-service-role-key';
