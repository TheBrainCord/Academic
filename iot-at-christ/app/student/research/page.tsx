import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { IdeaExplorer } from '@/components/research/IdeaExplorer'

export default async function StudentResearchPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: myProject }, { data: classProjects }] = await Promise.all([
    supabase.from('research_projects')
      .select('id, title, domain, approval_status, updated_at')
      .eq('owner_id', user!.id)
      .single(),
    supabase.from('research_projects')
      .select('id, title, domain, approval_status, profiles(full_name), research_phases(status)')
      .eq('is_visible_to_class', true)
      .neq('owner_id', user!.id),
  ])

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-display font-bold text-christ-navy">Research Lab</h1>

      {/* My project or IdeaExplorer */}
      {!myProject ? (
        <IdeaExplorer />
      ) : (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-navy mb-3">My Project</h2>
          <Link href={`/student/research/${myProject.id}`}>
            <div className="rounded-lg border border-research-amber/40 bg-research-bg text-white p-5 hover:border-research-amber transition-colors">
              <p className="font-display font-bold">{myProject.title}</p>
              <p className="text-sm font-mono text-research-amber mt-1">{myProject.domain}</p>
              <p className="text-xs font-mono text-white/40 mt-2">{myProject.approval_status}</p>
            </div>
          </Link>
        </section>
      )}

      {/* Class board — approved projects only */}
      {classProjects && classProjects.length > 0 && (
        <section>
          <h2 className="text-base font-display font-semibold text-christ-navy mb-3">Class Board</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classProjects.map(p => {
              const phases   = (p.research_phases as any[]) ?? []
              const done     = phases.filter(ph => ph.status === 'completed').length
              const pct      = phases.length ? Math.round((done / phases.length) * 100) : 0
              return (
                <div key={p.id} className="rounded-lg border border-christ-navy/10 bg-white p-4">
                  <p className="font-display font-semibold text-christ-navy text-sm">{p.title}</p>
                  <p className="text-xs font-mono text-christ-navy/50">{(p.profiles as any)?.full_name} · {p.domain}</p>
                  <div className="mt-3 h-1.5 bg-christ-navy/10 rounded-full overflow-hidden">
                    <div className="h-full bg-christ-green rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
