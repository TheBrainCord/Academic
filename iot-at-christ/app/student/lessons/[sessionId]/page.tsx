import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AssignmentForm } from '@/components/student/AssignmentForm'

export default async function StudentSessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: session }, { data: submission }] = await Promise.all([
    supabase.from('sessions')
      .select('*, units(title, number, color_hex, icon, subjects(name))')
      .eq('id', params.sessionId)
      .single(),
    supabase.from('assignment_submissions')
      .select('id, status, grade, feedback, xp_awarded')
      .eq('session_id', params.sessionId)
      .eq('student_id', user!.id)
      .single(),
  ])

  if (!session) notFound()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <p className="text-xs font-mono text-christ-navy/40">
          Unit {session.units?.number}: {session.units?.title}
        </p>
        <h1 className="text-2xl font-display font-bold text-christ-navy mt-1">
          {session.number}. {session.title}
        </h1>
      </div>

      {/* Topics */}
      <section>
        <h2 className="text-base font-display font-semibold text-christ-navy mb-3">What we cover</h2>
        <ul className="space-y-2">
          {(session.topics as string[])?.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm font-body text-christ-navy/80">
              <span className="text-christ-saffron mt-0.5">▸</span> {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Keywords */}
      <section>
        <h2 className="text-base font-display font-semibold text-christ-navy mb-3">Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {(session.keywords as string[])?.map((k, i) => (
            <span key={i} className="px-2 py-1 rounded bg-christ-navy/8 text-xs font-mono text-christ-navy border border-christ-navy/10">
              {k}
            </span>
          ))}
        </div>
      </section>

      {/* Case study */}
      {session.case_study && (
        <section className="rounded-lg border-l-4 border-christ-saffron bg-white px-5 py-4">
          <p className="text-xs font-mono text-christ-saffron mb-1">CASE STUDY</p>
          <h3 className="font-display font-semibold text-christ-navy">{(session.case_study as any).title}</h3>
          <p className="text-xs font-mono text-christ-navy/50">{(session.case_study as any).org}</p>
          <p className="text-sm font-body text-christ-navy/70 mt-2">{(session.case_study as any).description}</p>
        </section>
      )}

      {/* Tools */}
      {(session.tools as string[])?.length > 0 && (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-navy mb-2">Tools</h2>
          <div className="flex flex-wrap gap-2">
            {(session.tools as string[]).map((tool, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-christ-saffron/10 text-xs font-mono text-christ-saffron border border-christ-saffron/20">
                {tool}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Assignment */}
      {session.assignment && (
        <AssignmentForm
          session={session}
          existingSubmission={submission}
          studentId={user!.id}
        />
      )}
    </div>
  )
}
