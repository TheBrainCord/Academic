import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CoordinatorSupervisors() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: supervisors } = await supabase
    .from('profiles')
    .select(`
      *,
      project_supervisors (project_id, active)
    `)
    .in('role', ['supervisor', 'teacher'])
    .order('available_slots', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Supervisor Directory</h1>
      <p className="text-sm text-gray-500 mb-6">All supervisors and their current capacity</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {(supervisors ?? []).map(s => {
          const activeProjects = (s.project_supervisors as Array<{ active: boolean }> ?? [])
            .filter(ps => ps.active).length

          return (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-christ-navy text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  {(s.full_name ?? s.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{s.full_name ?? s.email}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">{s.available_slots} slots</p>
                  <p className="text-xs text-gray-400">{activeProjects} active</p>
                </div>
              </div>

              {s.bio_short && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{s.bio_short}</p>
              )}

              {s.expertise_domains?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.expertise_domains.map((d: string) => (
                    <span key={d} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {s.linkedin_url && (
                <a
                  href={s.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-2 text-xs text-christ-navy hover:underline"
                >
                  LinkedIn →
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
