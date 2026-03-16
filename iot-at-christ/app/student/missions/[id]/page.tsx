import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function MissionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: subject } = await supabase
    .from('subjects')
    .select('config')
    .eq('slug', 'iot')
    .single()

  const missions = (subject?.config as any)?.missions ?? []
  const mission = missions[parseInt(params.id)]

  if (!mission) notFound()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${mission.status === 'locked' ? 'bg-christ-navy/20 text-christ-navy/50' : 'bg-christ-saffron/10 text-christ-saffron'}`}>
            {mission.status === 'locked' ? '🔒 LOCKED' : '⚡ ACTIVE'}
          </span>
          <span className="text-xs font-mono text-christ-navy/40">{mission.domain}</span>
          <span className="text-xs font-mono text-christ-gold font-bold">{mission.xp} XP</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-christ-navy">{mission.title}</h1>
      </div>

      <section className="rounded-lg border-l-4 border-christ-saffron bg-white px-5 py-4">
        <p className="text-xs font-mono text-christ-saffron mb-2">SITUATION</p>
        <p className="font-body text-sm text-christ-navy leading-relaxed">{mission.situation}</p>
      </section>

      <section>
        <p className="text-xs font-mono text-christ-navy/50 mb-2">CHALLENGE</p>
        <p className="font-body text-sm text-christ-navy leading-relaxed">{mission.challenge}</p>
      </section>

      <section>
        <h2 className="text-base font-display font-semibold text-christ-navy mb-3">Deliverables</h2>
        <ul className="space-y-2">
          {mission.deliverables?.map((d: string, i: number) => (
            <li key={i} className="flex gap-2 text-sm font-body text-christ-navy/80">
              <span className="text-christ-green mt-0.5">✓</span> {d}
            </li>
          ))}
        </ul>
      </section>

      {mission.hints && (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-navy mb-3">Hints</h2>
          <ul className="space-y-1">
            {mission.hints.map((h: string, i: number) => (
              <li key={i} className="text-xs font-mono text-christ-navy/50">💡 {h}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
