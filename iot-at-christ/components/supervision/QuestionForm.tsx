'use client'

import { useState } from 'react'

const CHECKLIST = [
  'I have searched available documentation and resources.',
  'I have tried at least 3 different approaches to solve this.',
  'I can clearly describe what I already attempted.',
]

interface Props {
  onSubmit: (question: string, context: string) => Promise<void>
}

export default function QuestionForm({ onSubmit }: Props) {
  const [checked,  setChecked]  = useState<boolean[]>(CHECKLIST.map(() => false))
  const [question, setQuestion] = useState('')
  const [context,  setContext]  = useState('')
  const [loading,  setLoading]  = useState(false)

  const allChecked = checked.every(Boolean)

  function toggleCheck(idx: number) {
    setChecked(prev => prev.map((v, i) => i === idx ? !v : v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allChecked || !question.trim()) return
    setLoading(true)
    try {
      await onSubmit(question, context)
      setQuestion('')
      setContext('')
      setChecked(CHECKLIST.map(() => false))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Pre-ask checklist */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-3">
          Before asking, please confirm you have:
        </p>
        <div className="space-y-2">
          {CHECKLIST.map((item, idx) => (
            <label key={idx} className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checked[idx]}
                onChange={() => toggleCheck(idx)}
                className="mt-0.5 rounded border-amber-300"
              />
              <span className="text-sm text-amber-900">{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          placeholder="What would you like to ask your supervisor?"
          disabled={!allChecked}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What have you already tried?
        </label>
        <textarea
          value={context}
          onChange={e => setContext(e.target.value)}
          rows={2}
          placeholder="Describe approaches you've already attempted…"
          disabled={!allChecked}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !allChecked || !question.trim()}
        className="w-full py-2 text-sm font-medium text-white bg-christ-navy rounded-lg hover:bg-christ-navy/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {!allChecked
          ? 'Complete the checklist to unlock'
          : loading
          ? 'Submitting…'
          : 'Submit Question'}
      </button>
    </form>
  )
}
