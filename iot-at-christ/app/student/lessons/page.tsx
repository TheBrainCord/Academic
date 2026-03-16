import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function StudentLessonsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: subject }, { data: progress }] = await Promise.all([
    supabase.from('subjects')
      .select('name, units(id, number, title, hours, icon, color_hex, sessions(id, number, title, hours))')
      .eq('slug', 'iot')
      .single(),
    supabase.from('student_progress')
      .select('session_id, completed')
      .eq('student_id', user!.id),
  ])

  const completedIds = new Set(progress?.filter(p => p.completed).map(p => p.session_id))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-christ-navy">{subject?.name}</h1>

      {(subject?.units as any[])?.map((unit: any) => (
        <div key={unit.id} className="rounded-lg border border-christ-navy/10 bg-white overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${unit.color_hex}` }}>
            <span className="text-xl">{unit.icon}</span>
            <div>
              <p className="text-xs font-mono text-christ-navy/40">Unit {unit.number} · {unit.hours}h</p>
              <h2 className="font-display font-semibold text-christ-navy text-sm">{unit.title}</h2>
            </div>
          </div>
          <ul className="divide-y divide-christ-navy/5">
            {(unit.sessions as any[])?.map((session: any) => {
              const done = completedIds.has(session.id)
              return (
                <li key={session.id}>
                  <Link
                    href={`/student/lessons/${session.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-christ-bg transition-colors"
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${done ? 'bg-christ-green border-christ-green' : 'border-christ-navy/20'}`} />
                    <span className="font-body text-sm text-christ-navy">
                      {session.number}. {session.title}
                    </span>
                    <span className="ml-auto text-xs font-mono text-christ-navy/30">{session.hours}h</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
