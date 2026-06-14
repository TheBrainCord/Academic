import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'

const EVENT_LABELS: Record<string, string> = {
  lab_view: 'Opened Virtual Lab',
  sign_in: 'Signed in',
  challenge_completed: 'Completed challenge',
  sketch_run: 'Ran sketch',
}

export default async function SimulatorUsagePage() {
  const supabase = createClient()

  const [{ count: totalViews }, { count: totalSignIns }, { count: totalChallenges }, { data: recent }] =
    await Promise.all([
      supabase.from('simulator_events').select('*', { count: 'exact', head: true }).eq('event_type', 'lab_view'),
      supabase.from('simulator_events').select('*', { count: 'exact', head: true }).eq('event_type', 'sign_in'),
      supabase.from('simulator_events').select('*', { count: 'exact', head: true }).eq('event_type', 'challenge_completed'),
      supabase.from('simulator_events')
        .select('id, event_type, session_id, path, board_id, challenge_id, created_at, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50),
    ])

  // Unique anonymous + signed-in visitors among recent events
  const uniqueSessions = new Set((recent ?? []).map(e => e.session_id)).size

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-christ-navy">Simulator Usage</h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1">
          Who&apos;s opening the Virtual Lab and how far they&apos;re getting.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Lab views" value={totalViews ?? 0} />
        <StatCard label="Sign-ins" value={totalSignIns ?? 0} />
        <StatCard label="Challenges completed" value={totalChallenges ?? 0} />
        <StatCard label="Recent unique sessions" value={uniqueSessions} />
      </div>

      <section>
        <h2 className="text-xl font-display font-semibold text-christ-navy mb-4">Recent activity</h2>
        {!recent || recent.length === 0 ? (
          <p className="text-sm font-body text-christ-navy/50">No simulator activity yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-christ-navy/10 bg-white">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-christ-navy/10 text-left text-christ-navy/60">
                  <th className="px-4 py-2 font-semibold">Event</th>
                  <th className="px-4 py-2 font-semibold">Who</th>
                  <th className="px-4 py-2 font-semibold">Details</th>
                  <th className="px-4 py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(event => {
                  const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles
                  return (
                    <tr key={event.id} className="border-b border-christ-navy/5 last:border-0">
                      <td className="px-4 py-2 text-christ-navy">{EVENT_LABELS[event.event_type] ?? event.event_type}</td>
                      <td className="px-4 py-2 text-christ-navy/70">
                        {profile?.full_name ?? profile?.email ?? `Anonymous (${event.session_id.slice(0, 8)})`}
                      </td>
                      <td className="px-4 py-2 text-christ-navy/50 font-mono text-xs">
                        {[event.board_id, event.challenge_id, event.path].filter(Boolean).join(' · ')}
                      </td>
                      <td className="px-4 py-2 text-christ-navy/50">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-5">
      <p className="text-sm font-body text-christ-navy/60">{label}</p>
      <p className="text-3xl font-display font-bold text-christ-navy mt-1">{value}</p>
    </div>
  )
}
