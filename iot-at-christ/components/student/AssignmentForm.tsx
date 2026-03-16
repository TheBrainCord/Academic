'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  session:            any
  existingSubmission: any
  studentId:          string
}

export function AssignmentForm({ session, existingSubmission, studentId }: Props) {
  const supabase  = createClient()
  const assignment = session.assignment as any
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(!!existingSubmission)

  async function handleSubmit() {
    setSubmitting(true)
    if (existingSubmission) {
      await supabase.from('assignment_submissions')
        .update({ status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', existingSubmission.id)
    } else {
      await supabase.from('assignment_submissions').insert({
        session_id:  session.id,
        student_id:  studentId,
        status:      'submitted',
        submitted_at: new Date().toISOString(),
      })
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <section className="rounded-lg border border-christ-gold/30 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-christ-gold">{assignment.type} · {assignment.xp} XP · Due {assignment.due_days}d</p>
        {existingSubmission?.status === 'graded' && (
          <span className="text-xs font-mono text-christ-green font-bold">{existingSubmission.grade} ✓</span>
        )}
      </div>
      <p className="font-body text-sm text-christ-navy">{assignment.task}</p>

      {assignment.no_hw_alternative && (
        <p className="text-xs font-mono text-christ-navy/40">
          No hardware? {assignment.no_hw_alternative}
        </p>
      )}

      {existingSubmission?.feedback && (
        <div className="rounded bg-christ-green/5 border border-christ-green/20 px-3 py-2">
          <p className="text-xs font-mono text-christ-green mb-1">Teacher feedback</p>
          <p className="text-sm font-body text-christ-navy">{existingSubmission.feedback}</p>
        </div>
      )}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 rounded bg-christ-saffron text-white text-sm font-mono hover:bg-christ-navy transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Mark as Submitted'}
        </button>
      ) : (
        <p className="text-xs font-mono text-christ-navy/50">
          {existingSubmission?.status === 'graded' ? `Graded: ${existingSubmission.grade}` : 'Submitted — awaiting grade'}
        </p>
      )}
    </section>
  )
}
