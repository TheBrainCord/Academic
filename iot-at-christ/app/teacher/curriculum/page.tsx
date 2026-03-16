import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherCurriculumPage() {
  const supabase = createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, units(id, number, title, hours, icon, color_hex, sessions(id, number, title, hours))')
    .eq('slug', 'iot')
    .single()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-christ-navy">
        {subject?.name ?? 'Curriculum'}
      </h1>

      <div className="space-y-6">
        {subject?.units?.map((unit: any) => (
          <div key={unit.id} className="rounded-lg border border-christ-navy/10 bg-white overflow-hidden">
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{ borderLeft: `4px solid ${unit.color_hex}` }}
            >
              <span className="text-2xl">{unit.icon}</span>
              <div>
                <p className="text-xs font-mono text-christ-navy/50">Unit {unit.number} · {unit.hours}h</p>
                <h2 className="font-display font-semibold text-christ-navy">{unit.title}</h2>
              </div>
            </div>
            <ul className="divide-y divide-christ-navy/5">
              {unit.sessions?.map((session: any) => (
                <li key={session.id}>
                  <Link
                    href={`/teacher/curriculum/${session.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-christ-bg transition-colors"
                  >
                    <span className="font-body text-sm text-christ-navy">
                      Session {session.number}: {session.title}
                    </span>
                    <span className="text-xs font-mono text-christ-navy/40">{session.hours}h →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
