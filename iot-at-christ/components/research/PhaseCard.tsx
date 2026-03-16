'use client'

import { useState } from 'react'

interface Phase {
  id:                  string
  number:              number
  title:               string
  description:         string
  planned_outcome:     string
  status:              string
  trl:                 number
  student_observation: string
  ai_suggestions:      string[] | null
}

const STATUS_COLORS: Record<string, string> = {
  planned:     'text-white/40',
  'in-progress': 'text-research-amber',
  completed:   'text-christ-green',
}

export function PhaseCard({ phase, projectId }: { phase: Phase; projectId: string }) {
  const [observation, setObservation] = useState(phase.student_observation ?? '')
  const [loading, setLoading]         = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(phase.ai_suggestions ?? [])
  const [saving, setSaving]           = useState(false)

  async function handleGetSuggestions() {
    setLoading(true)
    const res  = await fetch('/api/research/ai-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, phaseId: phase.id }),
    })
    const data = await res.json()
    if (data.suggestions) setSuggestions(data.suggestions)
    setLoading(false)
  }

  async function handleSaveObservation() {
    setSaving(true)
    await fetch(`/api/research/save-observation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phaseId: phase.id, observation }),
    })
    setSaving(false)
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-white/40">Phase {phase.number} · TRL {phase.trl}</p>
          <h3 className="font-display font-semibold text-white">{phase.title}</h3>
        </div>
        <span className={`text-xs font-mono ${STATUS_COLORS[phase.status] ?? 'text-white/40'}`}>
          {phase.status}
        </span>
      </div>

      <p className="text-sm font-body text-white/60">{phase.description}</p>

      <div>
        <p className="text-xs font-mono text-research-amber mb-2">Your Observations</p>
        <textarea
          value={observation}
          onChange={e => setObservation(e.target.value)}
          onBlur={handleSaveObservation}
          rows={3}
          placeholder="What did you find, measure, or build in this phase?"
          className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder-white/30 resize-none"
        />
        {saving && <p className="text-xs font-mono text-white/30 mt-1">Saving…</p>}
      </div>

      <button
        onClick={handleGetSuggestions}
        disabled={loading}
        className="text-xs font-mono text-research-amber border border-research-amber/30 px-3 py-1.5 rounded hover:bg-research-amber/10 transition-colors disabled:opacity-50"
      >
        {loading ? 'Thinking…' : 'Get AI Next Steps'}
      </button>

      {suggestions.length > 0 && (
        <ul className="space-y-1">
          {suggestions.map((s, i) => (
            <li key={i} className="text-xs font-mono text-white/60 flex gap-2">
              <span className="text-research-amber">{i + 1}.</span> {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
