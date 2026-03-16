import { createClient } from '@/lib/supabase/server'

export default async function TeacherDashboardPage() {
  const supabase = createClient()

  // Fetch overview counts in parallel
  const [{ count: studentCount }, { count: pendingCount }, { data: recentActivity }] =
    await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('assignment_submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('assignment_submissions')
        .select('id, status, submitted_at, profiles(full_name), sessions(title)')
        .order('submitted_at', { ascending: false })
        .limit(10),
    ])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold text-christ-navy">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Students" value={studentCount ?? 0} />
        <StatCard label="Pending Grading" value={pendingCount ?? 0} highlight />
        <StatCard label="Active Subject" value="IoT at CHRIST" />
      </div>

      <section>
        <h2 className="text-xl font-display font-semibold text-christ-navy mb-4">Recent Activity</h2>
        {/* TODO: render recentActivity rows */}
        <pre className="font-mono text-xs text-christ-navy/50">
          {JSON.stringify(recentActivity?.slice(0, 3), null, 2)}
        </pre>
      </section>
    </div>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${highlight ? 'border-christ-saffron bg-christ-saffron/5' : 'border-christ-navy/10 bg-white'}`}>
      <p className="text-sm font-body text-christ-navy/60">{label}</p>
      <p className="text-3xl font-display font-bold text-christ-navy mt-1">{value}</p>
    </div>
  )
}
