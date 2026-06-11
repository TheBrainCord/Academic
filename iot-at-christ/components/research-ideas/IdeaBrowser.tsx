'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { IdeaDifficulty, IdeaDomain, ResearchIdea } from '@/types/research-ideas'

const DOMAINS: { id: IdeaDomain | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'smart-city', label: 'Smart City' },
  { id: 'defence', label: 'Defence' },
  { id: 'environment', label: 'Environment' },
  { id: 'industrial', label: 'Industrial' },
]

const DIFFICULTIES: { id: IdeaDifficulty | 'all'; label: string }[] = [
  { id: 'all', label: 'All levels' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

const DOMAIN_STYLES: Record<IdeaDomain, string> = {
  healthcare: 'border-christ-red/30 text-christ-red bg-christ-red/5',
  agriculture: 'border-christ-green/30 text-christ-green bg-christ-green/5',
  'smart-city': 'border-christ-navy/30 text-christ-navy bg-christ-navy/5',
  defence: 'border-christ-gold/40 text-christ-gold bg-christ-gold/5',
  environment: 'border-teal-700/30 text-teal-700 bg-teal-700/5',
  industrial: 'border-christ-saffron/40 text-christ-saffron bg-christ-saffron/5',
}

const DIFFICULTY_STYLES: Record<IdeaDifficulty, string> = {
  beginner: 'bg-christ-green/10 text-christ-green',
  intermediate: 'bg-christ-saffron/10 text-christ-saffron',
  advanced: 'bg-christ-red/10 text-christ-red',
}

function ChipRow<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-body transition-colors',
            active === opt.id
              ? 'border-christ-saffron bg-christ-saffron/10 text-christ-saffron'
              : 'border-christ-navy/15 text-christ-navy/60 hover:border-christ-saffron/40',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className="rounded border border-christ-navy/10 bg-christ-bg px-1.5 py-0.5 text-[10px] font-mono text-christ-navy/60">
          {item}
        </span>
      ))}
    </div>
  )
}

function IdeaCard({ idea }: { idea: ResearchIdea }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-4 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn('text-[10px] font-mono border px-2 py-0.5 rounded', DOMAIN_STYLES[idea.domain])}>
          {idea.domain.replace('-', ' ')}
        </span>
        <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full', DIFFICULTY_STYLES[idea.difficulty])}>
          {idea.difficulty}
        </span>
        {idea.simulatorFriendly && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-christ-saffron/10 text-christ-saffron">
            Virtual-Lab friendly
          </span>
        )}
      </div>

      <h3 className="font-display font-semibold text-christ-navy text-base leading-snug">{idea.title}</h3>
      <p className="text-xs font-body text-christ-navy/60">{idea.summary}</p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-body text-christ-saffron self-start hover:underline"
      >
        {open ? 'Hide details' : 'Show details'}
      </button>

      {open && (
        <div className="space-y-2 pt-1 border-t border-christ-navy/10 mt-1">
          <div>
            <p className="text-[10px] font-display font-semibold text-christ-navy/70 uppercase tracking-wide">Real-world value</p>
            <p className="text-xs font-body text-christ-navy/60">{idea.realWorldValue}</p>
          </div>
          <div>
            <p className="text-[10px] font-display font-semibold text-christ-navy/70 uppercase tracking-wide">Research angle</p>
            <p className="text-xs font-body text-christ-navy/60">{idea.researchAngle}</p>
          </div>
          <div>
            <p className="text-[10px] font-display font-semibold text-christ-navy/70 uppercase tracking-wide mb-1">Hardware</p>
            <ChipList items={idea.hardware} />
          </div>
          <div>
            <p className="text-[10px] font-display font-semibold text-christ-navy/70 uppercase tracking-wide mb-1">Sensors</p>
            <ChipList items={idea.sensors} />
          </div>
          <div>
            <p className="text-[10px] font-display font-semibold text-christ-navy/70 uppercase tracking-wide mb-1">Paper keywords</p>
            <ChipList items={idea.paperKeywords} />
          </div>
          <div>
            <p className="text-[10px] font-display font-semibold text-christ-navy/70 uppercase tracking-wide">Suggested venues</p>
            <p className="text-xs font-body text-christ-navy/60">{idea.suggestedVenues.join(' · ')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2 mt-auto border-t border-christ-navy/10">
        {idea.simulatorFriendly && (
          <Link href="/student/simulator" className="text-xs font-body text-christ-saffron hover:underline">
            Try it in the Virtual Lab
          </Link>
        )}
        <Link href="/student/research" className="text-xs font-body text-christ-navy hover:underline">
          Start this in Research Lab →
        </Link>
      </div>
    </div>
  )
}

export function IdeaBrowser({ ideas }: { ideas: ResearchIdea[] }) {
  const [domain, setDomain] = useState<IdeaDomain | 'all'>('all')
  const [difficulty, setDifficulty] = useState<IdeaDifficulty | 'all'>('all')
  const [simOnly, setSimOnly] = useState(false)

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      if (domain !== 'all' && idea.domain !== domain) return false
      if (difficulty !== 'all' && idea.difficulty !== difficulty) return false
      if (simOnly && !idea.simulatorFriendly) return false
      return true
    })
  }, [ideas, domain, difficulty, simOnly])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <ChipRow options={DOMAINS} active={domain} onChange={setDomain} />
        <ChipRow options={DIFFICULTIES} active={difficulty} onChange={setDifficulty} />
        <button
          onClick={() => setSimOnly((v) => !v)}
          className={cn(
            'whitespace-nowrap rounded-full border px-3 py-1 text-xs font-body transition-colors',
            simOnly
              ? 'border-christ-saffron bg-christ-saffron/10 text-christ-saffron'
              : 'border-christ-navy/15 text-christ-navy/60 hover:border-christ-saffron/40',
          )}
        >
          Virtual-Lab friendly only
        </button>
      </div>

      <p className="text-xs font-body text-christ-navy/40">
        Showing {filtered.length} of {ideas.length} ideas
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </div>
    </div>
  )
}
