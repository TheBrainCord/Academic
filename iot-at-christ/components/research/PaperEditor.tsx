'use client'

import { useState } from 'react'
import { PAPER_SECTIONS } from '@/lib/anthropic/paper-draft'

interface Section {
  id:           string
  section_type: string
  content:      string
}

export function PaperEditor({ sections, projectId }: { sections: Section[]; projectId: string }) {
  const [contents, setContents] = useState<Record<string, string>>(
    Object.fromEntries(sections.map(s => [s.section_type, s.content ?? '']))
  )
  const [drafting, setDrafting] = useState<string | null>(null)

  async function handleDraft(sectionType: string) {
    setDrafting(sectionType)
    const res  = await fetch('/api/research/ai-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, sectionType }),
    })
    const data = await res.json()
    if (data.draft) setContents(prev => ({ ...prev, [sectionType]: data.draft }))
    setDrafting(null)
  }

  return (
    <div className="space-y-6">
      {PAPER_SECTIONS.map(sec => (
        <div key={sec.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-research-amber">{sec.label.toUpperCase()}</p>
            <button
              onClick={() => handleDraft(sec.key)}
              disabled={drafting === sec.key}
              className="text-xs font-mono text-white/40 hover:text-research-amber transition-colors disabled:opacity-40"
            >
              {drafting === sec.key ? 'Drafting…' : '✦ AI Draft'}
            </button>
          </div>
          <textarea
            value={contents[sec.key] ?? ''}
            onChange={e => setContents(prev => ({ ...prev, [sec.key]: e.target.value }))}
            rows={6}
            placeholder={`Write the ${sec.label} section here…`}
            className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder-white/20 resize-y"
          />
        </div>
      ))}

      <a
        href={`/api/research/export-ieee?projectId=${projectId}`}
        className="inline-block px-4 py-2 rounded border border-research-amber/40 text-research-amber text-xs font-mono hover:bg-research-amber/10 transition-colors"
      >
        Export as IEEE PDF
      </a>
    </div>
  )
}
