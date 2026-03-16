import { createClient } from '@/lib/supabase/server'

export default async function StudentLeaderboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Aggregate XP per student
  const { data: rows } = await supabase
    .from('student_progress')
    .select('student_id, xp, profiles(full_name, avatar_url)')
    .order('xp', { ascending: false })

  // Sum XP per student
  const studentMap = new Map<string, { name: string; avatar: string; xp: number }>()
  for (const row of rows ?? []) {
    const prev = studentMap.get(row.student_id)
    studentMap.set(row.student_id, {
      name:   (row.profiles as any)?.full_name ?? 'Unknown',
      avatar: (row.profiles as any)?.avatar_url ?? '',
      xp:     (prev?.xp ?? 0) + (row.xp ?? 0),
    })
  }

  const ranked = Array.from(studentMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.xp - a.xp)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-christ-navy">Leaderboard</h1>

      <div className="space-y-2">
        {ranked.map((s, i) => {
          const isMe = s.id === user?.id
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
          return (
            <div
              key={s.id}
              className={`flex items-center gap-4 rounded-lg border px-5 py-3 ${isMe ? 'border-christ-gold bg-christ-gold/5' : 'border-christ-navy/10 bg-white'}`}
            >
              <span className="text-sm font-mono w-6 text-center">{medal}</span>
              {s.avatar && <img src={s.avatar} alt="" className="w-8 h-8 rounded-full" />}
              <span className={`font-body text-sm flex-1 ${isMe ? 'font-semibold text-christ-navy' : 'text-christ-navy/80'}`}>
                {s.name} {isMe && '(you)'}
              </span>
              <span className="font-mono text-sm font-bold text-christ-gold">{s.xp} XP</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
