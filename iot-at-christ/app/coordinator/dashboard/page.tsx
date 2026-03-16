import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CoordinatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Aggregate stats
  const [
    { count: studentCount },
    { count: supervisorCount },
    { data: pendingPhases },
    { data: unassignedProjects },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supervisor'),
    supabase.from('research_phases').select('id').eq('status', 'pending_review'),
    // Projects with no supervisor assigned
    supabase
      .from('research_projects')
      .select('id, title')
      .not('id', 'in', `(SELECT project_id FROM project_supervisors WHERE active = true)`),
  ])

  const stats = [
    { label: 'Students',         value: studentCount ?? 0 },
    { label: 'Supervisors',      value: supervisorCount ?? 0 },
    { label: 'Pending Reviews',  value: pendingPhases?.length ?? 0 },
    { label: 'Unassigned Projects', value: unassignedProjects?.length ?? 0 },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Coordinator Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Platform overview — Christ University IoT Research</p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-christ-navy">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/coordinator/students"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <p className="font-semibold text-gray-900 text-sm">Manage Students</p>
          <p className="text-xs text-gray-500 mt-1">View student projects and assign supervisors</p>
        </Link>
        <Link
          href="/coordinator/supervisors"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
        >
          <p className="font-semibold text-gray-900 text-sm">Supervisor Directory</p>
          <p className="text-xs text-gray-500 mt-1">Browse supervisors by expertise and availability</p>
        </Link>
      </div>

      {/* Unassigned projects alert */}
      {(unassignedProjects ?? []).length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            {unassignedProjects!.length} project{unassignedProjects!.length > 1 ? 's' : ''} without a supervisor
          </p>
          <div className="space-y-1">
            {unassignedProjects!.slice(0, 5).map(p => (
              <Link
                key={p.id}
                href={`/coordinator/students/${p.id}/assign-supervisor`}
                className="block text-xs text-amber-700 hover:underline"
              >
                {p.title ?? 'Untitled'} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
