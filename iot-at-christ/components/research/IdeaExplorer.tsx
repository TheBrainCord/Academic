'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { IdeaExploreResult } from '@/lib/anthropic/research-suggest'

export function IdeaExplorer() {
  const supabase = createClient()
  const [idea, setIdea]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<IdeaExploreResult | null>(null)
  const [selected, setSelected]   = useState<number | null>(null)
  const [name, setName]           = useState('')
  const [creating, setCreating]   = useState(false)

  async function handleExplore() {
    if (idea.length < 10) return
    setLoading(true)
    const res  = await fetch('/api/research/idea-explore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawIdea: idea }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (selected === null || !result) return
    setCreating(true)
    const option = result.options[selected]
    const { data: { user } } = await supabase.auth.getUser()

    const { data: subject } = await supabase
      .from('subjects').select('id').eq('slug', 'iot').single()

    const { data: project } = await supabase.from('research_projects').insert({
      title:          result.refined_title,
      domain:         option.angle,
      abstract:       result.problem_statement,
      target_venue:   option.venue,
      owner_id:       user?.id,
      subject_id:     subject?.id,
      approval_status: 'draft',
    }).select('id').single()

    if (project) {
      // Create the 4 phases
      await supabase.from('research_phases').insert(
        option.phases.map((title: string, i: number) => ({
          project_id: project.id,
          number:     i + 1,
          title,
          status:     i === 0 ? 'in-progress' : 'planned',
          trl:        i + 1,
        }))
      )
      window.location.href = `/student/research/${project.id}`
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-display font-semibold text-christ-navy mb-2">Start Your Research</h2>
        <p className="text-sm font-body text-christ-navy/60 mb-4">
          Describe a problem you want to solve with IoT. Don't worry about making it perfect.
        </p>
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="e.g. I want to monitor water quality in rural areas using cheap sensors..."
          rows={3}
          className="w-full rounded border border-christ-navy/20 px-3 py-2 text-sm font-body text-christ-navy resize-none"
        />
        <button
          onClick={handleExplore}
          disabled={loading || idea.length < 10}
          className="mt-2 px-4 py-2 rounded bg-christ-navy text-white text-sm font-mono hover:bg-christ-saffron transition-colors disabled:opacity-50"
        >
          {loading ? 'Exploring…' : 'Explore Idea with AI'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-lg border border-research-amber/30 bg-research-bg text-white p-5">
            <p className="text-xs font-mono text-research-amber mb-1">REFINED TITLE</p>
            <p className="font-display font-bold text-lg">{result.refined_title}</p>
            <p className="text-sm font-body text-white/70 mt-2">{result.novelty}</p>
          </div>

          <p className="text-xs font-mono text-christ-navy/50">Choose an angle:</p>

          {result.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-lg border p-4 transition-colors ${selected === i ? 'border-christ-saffron bg-christ-saffron/5' : 'border-christ-navy/10 bg-white hover:border-christ-navy/30'}`}
            >
              <p className="font-display font-semibold text-christ-navy">{opt.angle}</p>
              <p className="text-sm font-body text-christ-navy/70 mt-1">{opt.description}</p>
              <p className="text-xs font-mono text-christ-navy/40 mt-2">Target: {opt.venue}</p>
            </button>
          ))}

          {selected !== null && (
            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name (for the paper)"
                className="flex-1 rounded border border-christ-navy/20 px-3 py-2 text-sm font-body text-christ-navy"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 rounded bg-christ-saffron text-white text-sm font-mono hover:bg-christ-navy transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create Project →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
