import Link from 'next/link'

const DIFFICULTY_COLOR: Record<string, string> = {
  Easy:   'text-christ-green',
  Medium: 'text-christ-gold',
  Hard:   'text-christ-red',
}

export function MissionCard({ mission }: { mission: any }) {
  const locked = mission.status === 'locked'

  return (
    <div className={`rounded-lg border overflow-hidden ${locked ? 'border-christ-navy/10 opacity-60' : 'border-christ-saffron/20 hover:border-christ-saffron'} bg-white transition-colors`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-mono ${DIFFICULTY_COLOR[mission.difficulty] ?? 'text-christ-navy/50'}`}>
            {mission.difficulty}
          </span>
          <span className="text-xs font-mono text-christ-gold font-bold">{mission.xp} XP</span>
        </div>
        <h3 className="font-display font-semibold text-christ-navy">{mission.title}</h3>
        <p className="text-xs font-mono text-christ-navy/50 mt-1">{mission.domain}</p>
        <p className="text-sm font-body text-christ-navy/70 mt-2 line-clamp-2">{mission.story}</p>

        {locked ? (
          <p className="mt-3 text-xs font-mono text-christ-navy/30">🔒 Complete earlier units to unlock</p>
        ) : (
          <Link
            href={`/student/missions/${mission.index}`}
            className="mt-3 inline-block text-xs font-mono text-christ-saffron hover:underline"
          >
            Accept mission →
          </Link>
        )}
      </div>
    </div>
  )
}
