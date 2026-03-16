import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SupervisorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch assigned projects with student info and pending review count
  const { data: assignments } = await supabase
    .from('project_supervisors')
    .select(`
      supervisor_type,
      tagged_phases,
      project_id,
      research_projects (
        id, title, domain, approval_status,
        profiles!research_projects_owner_id_fkey (full_name, email, avatar_url),
        research_phases (id, status, number, title)
      )
    `)
    .eq('supervisor_id', user.id)
    .eq('active', true)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Supervisor Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Your assigned research projects</p>

      {!assignments || assignments.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-gray-400 text-sm">No projects assigned yet.</p>
          <p className="text-gray-400 text-xs mt-1">A coordinator will assign you to projects.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map(a => {
            const project = a.research_projects as Record<string, unknown> | null
            if (!project) return null

            const phases   = (project.research_phases as Array<{ status: string }>) ?? []
            const pending  = phases.filter(p => p.status === 'pending_review').length
            const student  = project.profiles as { full_name?: string; email: string } | null

            return (
              <Link
                key={a.project_id}
                href={`/supervisor/project/${a.project_id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug">
                      {String(project.title ?? 'Untitled')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {student?.full_name ?? student?.email ?? 'Unknown student'}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.supervisor_type === 'primary'
                        ? 'bg-christ-navy text-white'
                        : 'bg-christ-saffron/10 text-christ-saffron'
                    }`}
                  >
                    {a.supervisor_type === 'primary' ? 'Primary' : 'Advisor'}
                  </span>
                </div>

                {project.domain && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {String(project.domain)}
                  </span>
                )}

                {pending > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      {pending} phase{pending > 1 ? 's' : ''} pending review
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-3">
                  {phases.length} phase{phases.length !== 1 ? 's' : ''} total
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
