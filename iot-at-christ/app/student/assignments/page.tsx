import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function StudentAssignmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: submissions } = await supabase
    .from('assignment_submissions')
    .select('*, sessions(id, title, assignment)')
    .eq('student_id', user!.id)
    .order('submitted_at', { ascending: false })

  const pending  = submissions?.filter(s => s.status === 'pending') ?? []
  const submitted = submissions?.filter(s => s.status === 'submitted') ?? []
  const graded   = submissions?.filter(s => s.status === 'graded') ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold text-christ-navy">Assignments</h1>

      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-saffron mb-3">Pending</h2>
          <div className="space-y-2">
            {pending.map(s => (
              <Link key={s.id} href={`/student/lessons/${(s.sessions as any)?.id}`}>
                <div className="rounded border border-christ-saffron/20 bg-white px-4 py-3 hover:border-christ-saffron transition-colors">
                  <p className="font-body text-sm text-christ-navy">{(s.sessions as any)?.title}</p>
                  <p className="text-xs font-mono text-christ-saffron mt-0.5">
                    {(s.sessions as any)?.assignment?.xp} XP · due {(s.sessions as any)?.assignment?.due_days}d
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {submitted.length > 0 && (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-navy/60 mb-3">Submitted — awaiting grade</h2>
          <div className="space-y-2">
            {submitted.map(s => (
              <div key={s.id} className="rounded border border-christ-navy/10 bg-white px-4 py-3">
                <p className="font-body text-sm text-christ-navy">{(s.sessions as any)?.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {graded.length > 0 && (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-green mb-3">Graded</h2>
          <div className="space-y-2">
            {graded.map(s => (
              <div key={s.id} className="rounded border border-christ-green/20 bg-white px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="font-body text-sm text-christ-navy">{(s.sessions as any)?.title}</p>
                  {s.feedback && (
                    <p className="text-xs font-body text-christ-navy/50 mt-1 italic">{s.feedback}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-christ-green">{s.grade}</p>
                  <p className="text-xs font-mono text-christ-gold">+{s.xp_awarded} XP</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
