'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { gradeToXP } from '@/lib/utils'

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C']

interface Props { submission: any }

export function GradingPanel({ submission }: Props) {
  const supabase = createClient()
  const [grade, setGrade]       = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  async function handleGrade() {
    if (!grade) return
    setSaving(true)
    const xp = gradeToXP(grade)
    await supabase.from('assignment_submissions').update({
      status:     'graded',
      grade,
      feedback,
      xp_awarded: xp,
      graded_at:  new Date().toISOString(),
    }).eq('id', submission.id)

    // Award XP — only once (upsert with unique constraint in DB)
    await supabase.from('student_progress').upsert({
      student_id:  submission.student_id,
      session_id:  submission.session_id,
      completed:   true,
      xp,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'student_id,session_id' })

    setSaving(false)
    setDone(true)
  }

  if (done) return (
    <div className="rounded border border-christ-green/30 bg-christ-green/5 px-4 py-3">
      <p className="text-sm font-body text-christ-green">
        Graded: <strong>{grade}</strong> (+{gradeToXP(grade)} XP)
      </p>
    </div>
  )

  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-4 space-y-3">
      <div>
        <p className="font-body text-sm font-semibold text-christ-navy">{submission.profiles?.full_name}</p>
        <p className="text-xs font-mono text-christ-navy/50">{submission.sessions?.title}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {GRADES.map(g => (
          <button
            key={g}
            onClick={() => setGrade(g)}
            className={`px-3 py-1 rounded border text-xs font-mono transition-colors ${grade === g ? 'bg-christ-navy text-white border-christ-navy' : 'border-christ-navy/20 text-christ-navy hover:border-christ-navy'}`}
          >
            {g}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Feedback (optional)"
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        rows={2}
        className="w-full rounded border border-christ-navy/20 px-3 py-2 text-sm font-body text-christ-navy resize-none"
      />
      <button
        onClick={handleGrade}
        disabled={saving || !grade}
        className="px-4 py-2 rounded bg-christ-saffron text-white text-sm font-mono hover:bg-christ-navy transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Submit Grade'}
      </button>
    </div>
  )
}
