import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SessionScheduler } from '@/components/teacher/SessionScheduler'

export default async function TeacherSessionDetailPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*, units(title, number, color_hex, icon, subjects(name))')
    .eq('id', params.sessionId)
    .single()

  if (!session) notFound()

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-mono text-christ-navy/50">
          {session.units?.subjects?.name} · Unit {session.units?.number}: {session.units?.title}
        </p>
        <h1 className="text-3xl font-display font-bold text-christ-navy mt-1">
          Session {session.number}: {session.title}
        </h1>
        <p className="text-sm font-mono text-christ-navy/40">{session.hours}h</p>
      </div>

      {/* Topics */}
      <section>
        <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Topics</h2>
        <ul className="space-y-1">
          {(session.topics as string[])?.map((t, i) => (
            <li key={i} className="text-sm font-body text-christ-navy/80 flex gap-2">
              <span className="text-christ-saffron">▸</span> {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Keywords */}
      <section>
        <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {(session.keywords as string[])?.map((k, i) => (
            <span key={i} className="px-2 py-1 rounded bg-christ-navy/10 text-xs font-mono text-christ-navy">
              {k}
            </span>
          ))}
        </div>
      </section>

      {/* Assignment */}
      {session.assignment && (
        <section>
          <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Assignment</h2>
          <div className="rounded-lg border border-christ-gold/30 bg-christ-gold/5 p-4 space-y-2">
            <p className="text-xs font-mono text-christ-gold">{(session.assignment as any).type} · {(session.assignment as any).xp} XP · Due {(session.assignment as any).due_days}d</p>
            <p className="font-body text-sm text-christ-navy">{(session.assignment as any).task}</p>
          </div>
        </section>
      )}

      {/* Schedule setter — client component */}
      <SessionScheduler sessionId={session.id} currentScheduledAt={session.scheduled_at} />
    </div>
  )
}
