import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PhaseCard } from '@/components/research/PhaseCard'
import { PaperEditor } from '@/components/research/PaperEditor'

export default async function StudentResearchWorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: project } = await supabase
    .from('research_projects')
    .select('*, research_phases(*), paper_sections(*)')
    .eq('id', params.id)
    .single()

  if (!project) notFound()
  // Students can only access their own project — RLS enforces this too
  if (project.owner_id !== user?.id) redirect('/student/research')

  const phases   = ((project.research_phases as any[]) ?? []).sort((a, b) => a.number - b.number)
  const sections = ((project.paper_sections as any[]) ?? []).sort((a, b) => a.order - b.order)

  return (
    // Dark theme for Research Lab — intentional contrast
    <div className="min-h-screen bg-research-bg text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <div>
          <p className="text-xs font-mono text-research-amber">{project.domain}</p>
          <h1 className="text-3xl font-display font-bold mt-1">{project.title}</h1>
          <p className="text-xs font-mono text-white/40 mt-1">{project.approval_status}</p>
        </div>

        {/* Phases */}
        <section>
          <h2 className="text-xl font-display font-semibold text-research-amber mb-4">Phases</h2>
          <div className="space-y-4">
            {phases.map((phase: any) => (
              <PhaseCard key={phase.id} phase={phase} projectId={project.id} />
            ))}
          </div>
        </section>

        {/* Paper sections */}
        <section>
          <h2 className="text-xl font-display font-semibold text-research-amber mb-4">Research Paper</h2>
          <PaperEditor sections={sections} projectId={project.id} />
        </section>
      </div>
    </div>
  )
}
