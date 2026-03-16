import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CoordinatorStudents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: projects } = await supabase
    .from('research_projects')
    .select(`
      id, title, domain, approval_status, updated_at,
      profiles!research_projects_owner_id_fkey (id, full_name, email, avatar_url),
      project_supervisors (
        supervisor_type, active,
        profiles!project_supervisors_supervisor_id_fkey (full_name, email)
      ),
      research_phases (status)
    `)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Projects</h1>
      <p className="text-sm text-gray-500 mb-6">All research projects across the programme</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Project</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Student</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Supervisors</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Progress</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(projects ?? []).map(p => {
              const student  = p.profiles as { id: string; full_name?: string; email: string } | null
              const phases   = (p.research_phases as Array<{ status: string }>) ?? []
              const sups     = (p.project_supervisors as Array<{
                supervisor_type: string; active: boolean
                profiles: { full_name?: string; email: string }
              }> ?? []).filter(s => s.active)

              const done    = phases.filter(ph => ph.status === 'completed').length
              const pending = phases.filter(ph => ph.status === 'pending_review').length

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{p.title ?? 'Untitled'}</p>
                    {p.domain && <p className="text-xs text-gray-400">{p.domain}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {student?.full_name ?? student?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {sups.length === 0 ? (
                      <span className="text-xs text-red-500 font-medium">Unassigned</span>
                    ) : (
                      <div className="space-y-0.5">
                        {sups.map((s, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            {s.profiles.full_name ?? s.profiles.email}
                            <span className="text-gray-400 ml-1">({s.supervisor_type})</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>{done}/{phases.length} phases done</p>
                      {pending > 0 && (
                        <p className="text-amber-600 font-medium">{pending} pending review</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/coordinator/students/${p.id}/assign-supervisor`}
                      className="text-xs text-christ-navy hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
