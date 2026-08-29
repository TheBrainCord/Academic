import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherCurriculumPage() {
  const supabase = createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('id, name, config, units(id, number, title, hours, icon, color_hex, sessions(id, number, title, hours))')
    .eq('slug', 'iot')
    .single()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-christ-navy/50">
          {(subject?.config as any)?.curriculumStatus?.officialSyllabusLabel ?? 'Official syllabus content'}
        </p>
        <h1 className="text-3xl font-display font-bold text-christ-navy">{subject?.name ?? 'Curriculum'}</h1>
      </div>

      <aside className="rounded-lg border border-christ-saffron/30 bg-christ-saffron/5 px-5 py-4">
        <p className="font-display font-semibold text-christ-navy">
          {(subject?.config as any)?.curriculumStatus?.livingCurriculumLabel ?? 'Living curriculum update'}
        </p>
        <p className="mt-1 text-sm text-christ-navy/65">
          Modern platform, standards, and legal-status notes are maintained separately from the official syllabus.
          {' '}Verified {(subject?.config as any)?.curriculumStatus?.lastVerified ?? 'date unavailable'}.
        </p>
      </aside>

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
