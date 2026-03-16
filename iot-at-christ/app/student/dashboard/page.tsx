import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function StudentDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: progress }, { data: nextSession }, { data: announcements }] =
    await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url').eq('id', user!.id).single(),
      supabase.from('student_progress').select('xp, completed').eq('student_id', user!.id),
      supabase.from('sessions')
        .select('id, title, number, scheduled_at, units(title, number)')
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(1)
        .single(),
      supabase.from('forum_posts')
        .select('id, title, created_at')
        .eq('is_announcement', true)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

  const totalXP     = progress?.reduce((sum, r) => sum + (r.xp ?? 0), 0) ?? 0
  const completedCount = progress?.filter(r => r.completed).length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-body text-christ-navy/50">Welcome back,</p>
        <h1 className="text-3xl font-display font-bold text-christ-navy">
          {profile?.full_name?.split(' ')[0]}
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-christ-gold/30 bg-white p-4 text-center">
          <p className="text-3xl font-display font-bold text-christ-gold">{totalXP}</p>
          <p className="text-xs font-mono text-christ-navy/50 mt-1">Total XP</p>
        </div>
        <div className="rounded-lg border border-christ-green/30 bg-white p-4 text-center">
          <p className="text-3xl font-display font-bold text-christ-green">{completedCount}</p>
          <p className="text-xs font-mono text-christ-navy/50 mt-1">Sessions Done</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-lg border border-christ-navy/10 bg-white p-4 text-center">
          <p className="text-xs font-mono text-christ-navy/50 mb-1">Next Session</p>
          {nextSession ? (
            <Link href={`/student/lessons/${nextSession.id}`} className="font-display font-semibold text-christ-navy text-sm hover:text-christ-saffron">
              Session {nextSession.number}: {nextSession.title}
            </Link>
          ) : (
            <p className="text-sm font-body text-christ-navy/40">No upcoming sessions</p>
          )}
        </div>
      </div>

      {/* Announcements */}
      {announcements && announcements.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Announcements</h2>
          <div className="space-y-2">
            {announcements.map(a => (
              <div key={a.id} className="rounded border-l-4 border-christ-saffron bg-white px-4 py-3">
                <p className="font-body text-sm text-christ-navy">{a.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
