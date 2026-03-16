import { createClient } from '@/lib/supabase/server'
import { ReminderHistory } from '@/components/teacher/ReminderHistory'

export default async function TeacherRemindersPage() {
  const supabase = createClient()

  const { data: reminders } = await supabase
    .from('reminder_schedules')
    .select('*, sessions(title, scheduled_at)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-christ-navy">Reminders</h1>
      </div>
      <p className="text-sm font-body text-christ-navy/60">
        Reminder emails are sent automatically 24 hours before each scheduled session.
        The system checks every hour and is idempotent — no duplicate sends.
      </p>
      <ReminderHistory reminders={reminders ?? []} />
    </div>
  )
}
