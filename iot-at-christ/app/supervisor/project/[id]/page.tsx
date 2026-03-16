import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { buildSupervisorContext, canSignOffPhase, canReadPhase, canReadSection, canReadPrivateComments } from '@/lib/roles/permissions'
import SignOffModal from '@/components/supervision/SignOffModal'
import SupervisorCard from '@/components/supervision/SupervisorCard'
import CommentThread from '@/components/supervision/CommentThread'
import MeetingNoteForm from '@/components/supervision/MeetingNoteForm'
import { sendNotification } from '@/lib/notifications/send'
import type { SignoffDecision } from '@/types/database'

interface Props {
  params: { id: string }
  searchParams: { tab?: string }
}

export default async function SupervisorProjectPage({ params, searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const tab = searchParams.tab ?? 'overview'

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, role_subtype')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  // Fetch supervisor's assignment for this project
  const { data: assignment } = await supabase
    .from('project_supervisors')
    .select('supervisor_type, tagged_phases, tagged_sections')
    .eq('project_id', params.id)
    .eq('supervisor_id', user.id)
    .eq('active', true)
    .maybeSingle()

  // Coordinators/teachers can view without being in project_supervisors
  const isCoordinator = profile.role === 'coordinator' || profile.role === 'teacher'
  if (!assignment && !isCoordinator) notFound()

  const ctx = buildSupervisorContext(
    user.id,
    profile.role,
    profile.role_subtype,
    assignment
      ? {
          supervisor_type: assignment.supervisor_type,
          tagged_phases:   assignment.tagged_phases,
          tagged_sections: assignment.tagged_sections,
          project_id:      params.id,
        }
      : null
  )

  // Fetch project + student
  const { data: project } = await supabase
    .from('research_projects')
    .select(`
      id, title, domain, target_venue, approval_status,
      profiles!research_projects_owner_id_fkey (id, full_name, email, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const student = project.profiles as { id: string; full_name?: string; email: string } | null

  // Fetch phases (filtered for advisors)
  const { data: allPhases } = await supabase
    .from('research_phases')
    .select('*')
    .eq('project_id', params.id)
    .order('number')

  const phases = (allPhases ?? []).filter(p =>
    canReadPhase(ctx, p.number ?? 0)
  )

  // Fetch paper sections (filtered for advisors)
  const { data: allSections } = await supabase
    .from('paper_sections')
    .select('*')
    .eq('project_id', params.id)
    .order('order')

  const sections = (allSections ?? []).filter(s =>
    canReadSection(ctx, s.section_type ?? '')
  )

  // Fetch all supervisors assigned to this project
  const { data: coSupervisors } = await supabase
    .from('project_supervisors')
    .select(`supervisor_type, tagged_phases, tagged_sections, profiles!project_supervisors_supervisor_id_fkey (*)`)
    .eq('project_id', params.id)
    .eq('active', true)

  // Fetch comments
  const commentsQuery = supabase
    .from('supervision_comments')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at')

  if (!canReadPrivateComments(ctx)) {
    commentsQuery.eq('is_private', false)
  }
  const { data: comments } = await commentsQuery

  // Fetch meetings
  const { data: meetings } = await supabase
    .from('supervision_meetings')
    .select('*')
    .eq('project_id', params.id)
    .order('scheduled_at', { ascending: false })

  // Fetch questions
  const { data: questions } = await supabase
    .from('research_questions')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  // ── Server Actions ───────────────────────────────────────────────────────

  async function signOffPhase(phaseId: string, decision: SignoffDecision, feedback: string) {
    'use server'
    if (!canSignOffPhase(ctx)) return

    const supa = await createClient()
    await supa.from('phase_signoffs').upsert(
      { phase_id: phaseId, supervisor_id: user.id, decision, feedback },
      { onConflict: 'phase_id' }
    )

    const newStatus = decision === 'revision_requested' ? 'in-progress' : 'completed'
    await supa.from('research_phases').update({ status: newStatus }).eq('id', phaseId)

    if (student) {
      const phase = phases.find(p => p.id === phaseId)
      await sendNotification(
        decision === 'approved' || decision === 'coordinator_override' ? 'PHASE_APPROVED' : 'PHASE_REVISION',
        student.id,
        {
          phaseTitle:   phase?.title ?? '',
          projectTitle: String((project as Record<string, unknown>).title ?? ''),
          feedback,
        }
      )
    }

    revalidatePath(`/supervisor/project/${params.id}`)
  }

  async function addComment(content: string, isPrivate: boolean) {
    'use server'
    const supa = await createClient()
    await supa.from('supervision_comments').insert({
      project_id: params.id,
      author_id:  user.id,
      content,
      is_private: isPrivate,
    })
    revalidatePath(`/supervisor/project/${params.id}`)
  }

  async function logMeeting(data: {
    scheduled_at: string; agenda: string; notes: string; action_items: unknown[]
  }) {
    'use server'
    if (!student) return
    const supa = await createClient()
    await supa.from('supervision_meetings').insert({
      project_id:    params.id,
      supervisor_id: user.id,
      student_id:    student.id,
      scheduled_at:  data.scheduled_at,
      agenda:        data.agenda,
      notes:         data.notes,
      action_items:  data.action_items,
      status:        'completed',
    })
    revalidatePath(`/supervisor/project/${params.id}`)
  }

  async function answerQuestion(questionId: string, answer: string) {
    'use server'
    const supa = await createClient()
    await supa.from('research_questions')
      .update({ answer, answered_by: user.id, status: 'answered', answered_at: new Date().toISOString() })
      .eq('id', questionId)

    if (student) {
      const q = questions?.find(q => q.id === questionId)
      await sendNotification('QUESTION_ANSWERED', student.id, {
        question: q?.question ?? '',
        answer,
      })
    }
    revalidatePath(`/supervisor/project/${params.id}`)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const TABS = ['overview', 'phases', 'paper', 'comments', 'questions', 'meetings']

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {String((project as Record<string, unknown>).title ?? 'Untitled Project')}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Student: {student?.full_name ?? student?.email ?? '—'}
          {(project as Record<string, unknown>).domain ? ` · ${(project as Record<string, unknown>).domain}` : ''}
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <a
            key={t}
            href={`?tab=${t}`}
            className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap ${
              tab === t
                ? 'border-b-2 border-christ-navy text-christ-navy'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </a>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Supervision Team</h2>
            <div className="space-y-3">
              {(coSupervisors ?? []).map(cs => {
                const sup = cs.profiles as Record<string, unknown>
                if (!sup) return null
                return (
                  <SupervisorCard
                    key={String(sup.id)}
                    supervisor={sup as Parameters<typeof SupervisorCard>[0]['supervisor']}
                    supervisorType={cs.supervisor_type}
                    taggedPhases={cs.tagged_phases}
                    taggedSections={cs.tagged_sections}
                  />
                )
              })}
            </div>
          </section>
        </div>
      )}

      {/* Phases */}
      {tab === 'phases' && (
        <div className="space-y-4">
          {phases.length === 0 && (
            <p className="text-sm text-gray-400 italic">No accessible phases.</p>
          )}
          {phases.map(phase => (
            <div key={phase.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Phase {phase.number}: {phase.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  phase.status === 'completed'      ? 'bg-green-100 text-green-700'  :
                  phase.status === 'pending_review' ? 'bg-amber-100 text-amber-700'  :
                  phase.status === 'in-progress'    ? 'bg-blue-100 text-blue-700'    :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {phase.status}
                </span>
              </div>

              {phase.student_observation && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  <p className="text-xs font-medium text-gray-500 mb-1">Student Observation</p>
                  {phase.student_observation}
                </div>
              )}

              {canSignOffPhase(ctx) && phase.status === 'pending_review' && (
                <SignOffPhaseButton phase={phase} onSignOff={signOffPhase} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paper */}
      {tab === 'paper' && (
        <div className="space-y-4">
          {sections.length === 0 && (
            <p className="text-sm text-gray-400 italic">No accessible paper sections.</p>
          )}
          {sections.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="font-medium text-gray-900 text-sm mb-2">{s.section_type}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.content ?? '(empty)'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comments */}
      {tab === 'comments' && (
        <CommentThread
          comments={comments ?? []}
          projectId={params.id}
          canSeePrivate={canReadPrivateComments(ctx)}
          onAddComment={addComment}
        />
      )}

      {/* Questions */}
      {tab === 'questions' && (
        <div className="space-y-4">
          {(questions ?? []).length === 0 && (
            <p className="text-sm text-gray-400 italic">No questions yet.</p>
          )}
          {(questions ?? []).map(q => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900">{q.question}</p>
              {q.context && <p className="text-xs text-gray-500 mt-1">{q.context}</p>}
              {q.answer ? (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                  <p className="font-medium text-xs text-green-600 mb-1">Answer</p>
                  {q.answer}
                </div>
              ) : (
                <AnswerQuestionForm questionId={q.id} onAnswer={answerQuestion} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meetings */}
      {tab === 'meetings' && (
        <div className="space-y-6">
          <MeetingNoteForm
            projectId={params.id}
            studentId={student?.id ?? ''}
            supervisorId={user.id}
            onSave={logMeeting}
          />
          <div className="space-y-3">
            {(meetings ?? []).map(m => (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(m.scheduled_at).toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.status}
                  </span>
                </div>
                {m.agenda && <p className="text-xs text-gray-500">{m.agenda}</p>}
                {m.notes  && <p className="text-sm text-gray-700 mt-2">{m.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inline client micro-components ──────────────────────────────────────────

function SignOffPhaseButton({
  phase,
  onSignOff,
}: {
  phase: Parameters<typeof SignOffModal>[0]['phase']
  onSignOff: (id: string, d: SignoffDecision, f: string) => Promise<void>
}) {
  'use client'
  // This is a server component file so we use a simple approach:
  // Render the form inline since SignOffModal needs client state
  return (
    <div className="mt-3">
      <form
        action={async (fd: FormData) => {
          'use server'
          const decision  = fd.get('decision') as SignoffDecision
          const feedback  = String(fd.get('feedback') ?? '')
          await onSignOff(phase.id, decision, feedback)
        }}
        className="space-y-2 border-t border-gray-100 pt-3"
      >
        <p className="text-xs font-medium text-gray-700">Sign Off Decision</p>
        <select name="decision" className="text-sm border border-gray-300 rounded-lg px-2 py-1">
          <option value="approved">Approve</option>
          <option value="revision_requested">Request Revision</option>
          <option value="coordinator_override">Coordinator Override</option>
        </select>
        <textarea
          name="feedback"
          rows={2}
          placeholder="Feedback for student (required for revision)"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-medium text-white bg-christ-navy rounded-lg"
        >
          Submit
        </button>
      </form>
    </div>
  )
}

function AnswerQuestionForm({
  questionId,
  onAnswer,
}: {
  questionId: string
  onAnswer: (id: string, answer: string) => Promise<void>
}) {
  return (
    <form
      action={async (fd: FormData) => {
        'use server'
        const answer = String(fd.get('answer') ?? '')
        if (answer.trim()) await onAnswer(questionId, answer)
      }}
      className="mt-3 space-y-2"
    >
      <textarea
        name="answer"
        rows={3}
        placeholder="Write your answer…"
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none"
      />
      <button
        type="submit"
        className="px-4 py-1.5 text-sm font-medium text-white bg-christ-navy rounded-lg"
      >
        Submit Answer
      </button>
    </form>
  )
}
