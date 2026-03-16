import { createClient } from '@/lib/supabase/server'
import { GradingPanel } from '@/components/teacher/GradingPanel'

export default async function TeacherAssignmentsPage() {
  const supabase = createClient()

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, profiles(full_name, avatar_url), sessions(title, assignment)')
    .order('submitted_at', { ascending: true })

  const pending   = submissions?.filter(s => s.status === 'submitted') ?? []
  const graded    = submissions?.filter(s => s.status === 'graded') ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-christ-navy">Assignments</h1>

      <section>
        <h2 className="text-xl font-display font-semibold text-christ-navy mb-4">
          Pending Grading
          {pending.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-christ-saffron text-white text-xs font-mono">
              {pending.length}
            </span>
          )}
        </h2>
        <div className="space-y-3">
          {pending.map(s => <GradingPanel key={s.id} submission={s} />)}
          {pending.length === 0 && (
            <p className="font-body text-christ-navy/50 text-sm">All caught up!</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-display font-semibold text-christ-navy mb-4">Graded</h2>
        <div className="space-y-2">
          {graded.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded border border-christ-navy/10 bg-white px-4 py-3">
              <div>
                <p className="font-body text-sm text-christ-navy">{(s.profiles as any)?.full_name}</p>
                <p className="text-xs font-mono text-christ-navy/50">{(s.sessions as any)?.title}</p>
              </div>
              <span className="font-mono text-sm font-bold text-christ-green">{s.grade}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
