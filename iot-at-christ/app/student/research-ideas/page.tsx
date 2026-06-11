import { IdeaBrowser } from '@/components/research-ideas/IdeaBrowser'
import { RESEARCH_IDEAS } from '@/content/research-ideas/ideas'

// Server Component shell — filtering happens client-side in IdeaBrowser.
export default function ResearchIdeasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-christ-navy">Research Idea Bank</h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1">
          Curated, real-world IoT research directions to seed your paper — pick one, prototype it
          in the Virtual Lab, then start a project in the Research Lab.
        </p>
      </div>
      <IdeaBrowser ideas={RESEARCH_IDEAS} />
    </div>
  )
}
