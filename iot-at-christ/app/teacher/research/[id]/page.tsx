import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function TeacherResearchDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('research_projects')
    .select('*, profiles(full_name, email), research_phases(*), paper_sections(*)')
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const isOwner = project.owner_id === user?.id

  return (
    <div className={`min-h-screen ${isOwner ? 'bg-research-bg text-white' : 'bg-christ-bg text-christ-navy'} p-8 space-y-8`}>
      <div>
        <p className={`text-xs font-mono ${isOwner ? 'text-research-amber' : 'text-christ-navy/50'}`}>
          {isOwner ? 'My Project' : `Student: ${(project.profiles as any)?.full_name}`}
        </p>
        <h1 className="text-3xl font-display font-bold mt-1">{project.title}</h1>
        <p className={`font-mono text-sm mt-1 ${isOwner ? 'text-research-amber' : 'text-christ-navy/50'}`}>
          {project.domain} · {project.approval_status}
        </p>
      </div>

      {/* Teacher feedback form for student projects */}
      {!isOwner && (
        <div className="rounded-lg border border-christ-saffron/30 bg-christ-saffron/5 p-5">
          <h2 className="font-display font-semibold text-christ-navy mb-3">Review</h2>
          {/* TODO: ApprovalForm client component */}
          <p className="text-sm font-mono text-christ-navy/40">Approval form — coming in Step 11</p>
        </div>
      )}

      {/* Phases */}
      <section>
        <h2 className="text-xl font-display font-semibold mb-4">Phases</h2>
        <div className="space-y-3">
          {(project.research_phases as any[])?.map((phase: any) => (
            <div key={phase.id} className={`rounded-lg border p-4 ${isOwner ? 'border-research-amber/20 bg-white/5' : 'border-christ-navy/10 bg-white'}`}>
              <p className="font-display font-semibold">{phase.number}. {phase.title}</p>
              <p className={`text-xs font-mono mt-1 ${isOwner ? 'text-research-amber' : 'text-christ-navy/50'}`}>
                {phase.status} · TRL {phase.trl}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
