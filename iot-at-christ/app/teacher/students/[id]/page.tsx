import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function TeacherStudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: profile }, { data: submissions }, { data: research }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', params.id).single(),
    supabase.from('assignment_submissions')
      .select('id, status, grade, xp_awarded, submitted_at, sessions(title)')
      .eq('student_id', params.id)
      .order('submitted_at', { ascending: false }),
    supabase.from('research_projects')
      .select('id, title, domain, approval_status')
      .eq('owner_id', params.id)
      .single(),
  ])

  if (!profile) notFound()

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
        )}
        <div>
          <h1 className="text-2xl font-display font-bold text-christ-navy">{profile.full_name}</h1>
          <p className="font-mono text-sm text-christ-navy/50">{profile.email}</p>
        </div>
      </div>

      {research && (
        <section>
          <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Research Project</h2>
          <div className="rounded-lg border border-research-amber/30 bg-research-bg/5 p-4">
            <p className="font-display font-semibold text-christ-navy">{research.title}</p>
            <p className="text-xs font-mono text-christ-navy/50 mt-1">{research.domain} · {research.approval_status}</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Assignments</h2>
        <div className="space-y-2">
          {submissions?.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded border border-christ-navy/10 bg-white px-4 py-2">
              <span className="font-body text-sm text-christ-navy">{(s.sessions as any)?.title}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${s.status === 'graded' ? 'bg-christ-green/10 text-christ-green' : 'bg-christ-navy/10 text-christ-navy/50'}`}>
                {s.grade ?? s.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
