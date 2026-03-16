'use client'

import { useState } from 'react'
import type { ResearchPhase, SignoffDecision } from '@/types/database'

interface Props {
  phase: ResearchPhase
  open: boolean
  onClose: () => void
  onDecision: (decision: SignoffDecision, feedback: string) => Promise<void>
}

export default function SignOffModal({ phase, open, onClose, onDecision }: Props) {
  const [decision, setDecision] = useState<SignoffDecision>('approved')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (decision === 'revision_requested' && !feedback.trim()) {
      setError('Feedback is required when requesting revision.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onDecision(decision, feedback)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Phase Sign-Off</h2>
        <p className="text-sm text-gray-500 mb-4">
          Phase {phase.number}: <span className="font-medium text-gray-700">{phase.title}</span>
        </p>

        {phase.student_observation && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
            <p className="font-medium text-gray-500 mb-1">Student Observation</p>
            <p>{phase.student_observation}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Decision</legend>
            <div className="space-y-2">
              {(['approved', 'revision_requested', 'coordinator_override'] as SignoffDecision[]).map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    value={d}
                    checked={decision === d}
                    onChange={() => setDecision(d)}
                    className="text-christ-navy"
                  />
                  <span className="text-sm text-gray-700">
                    {d === 'approved'              && 'Approve'}
                    {d === 'revision_requested'    && 'Request Revision'}
                    {d === 'coordinator_override'  && 'Coordinator Override (Approve)'}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback {decision === 'revision_requested' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows={4}
              placeholder="Add comments for the student…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-christ-navy rounded-lg hover:bg-christ-navy/90 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
