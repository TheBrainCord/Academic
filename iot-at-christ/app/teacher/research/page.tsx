import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function TeacherResearchPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: ownProject }, { data: pendingProjects }, { data: approvedProjects }] =
    await Promise.all([
      supabase.from('research_projects').select('*').eq('owner_id', user!.id).single(),
      supabase.from('research_projects')
        .select('id, title, domain, owner_id, profiles(full_name)')
        .eq('approval_status', 'pending_review'),
      supabase.from('research_projects')
        .select('id, title, domain, owner_id, profiles(full_name)')
        .eq('approval_status', 'approved')
        .eq('is_visible_to_class', true),
    ])

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-display font-bold text-christ-navy">Research Lab</h1>

      {/* Teacher's own project */}
      {ownProject && (
        <section>
          <h2 className="text-xl font-display font-semibold text-christ-navy mb-3">My Project</h2>
          <Link href={`/teacher/research/${ownProject.id}`}>
            <div className="rounded-lg border border-research-amber/40 bg-research-bg text-white p-5 hover:border-research-amber transition-colors">
              <p className="font-display font-bold text-lg">{ownProject.title}</p>
              <p className="text-sm font-mono text-research-amber mt-1">{ownProject.domain}</p>
            </div>
          </Link>
        </section>
      )}

      {/* Pending approval */}
      <section>
        <h2 className="text-xl font-display font-semibold text-christ-navy mb-3">
          Awaiting Review
          {pendingProjects && pendingProjects.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-christ-saffron text-white text-xs font-mono">
              {pendingProjects.length}
            </span>
          )}
        </h2>
        <div className="space-y-3">
          {pendingProjects?.map(p => (
            <Link key={p.id} href={`/teacher/research/${p.id}`}>
              <div className="rounded-lg border border-christ-navy/10 bg-white p-4 hover:border-christ-saffron transition-colors">
                <p className="font-display font-semibold text-christ-navy">{p.title}</p>
                <p className="text-xs font-mono text-christ-navy/50 mt-1">
                  {(p.profiles as any)?.full_name} · {p.domain}
                </p>
              </div>
            </Link>
          ))}
          {!pendingProjects?.length && (
            <p className="text-sm font-body text-christ-navy/40">No projects awaiting review.</p>
          )}
        </div>
      </section>

      {/* Class board */}
      <section>
        <h2 className="text-xl font-display font-semibold text-christ-navy mb-3">Class Board</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {approvedProjects?.map(p => (
            <Link key={p.id} href={`/teacher/research/${p.id}`}>
              <div className="rounded-lg border border-christ-green/30 bg-white p-4 hover:border-christ-green transition-colors">
                <p className="font-display font-semibold text-christ-navy">{p.title}</p>
                <p className="text-xs font-mono text-christ-navy/50 mt-1">
                  {(p.profiles as any)?.full_name} · {p.domain}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
