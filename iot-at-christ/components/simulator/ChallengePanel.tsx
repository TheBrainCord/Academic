'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Circle, Lightbulb, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHALLENGES } from '@/lib/simulator/challenges'
import type { Circuit, ValidationResult } from '@/types/simulator'

const COMPLETED_KEY = 'iot-at-christ:simulator:challenges:v1'

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: 'bg-christ-green/10 text-christ-green',
  intermediate: 'bg-christ-saffron/10 text-christ-saffron',
  advanced: 'bg-christ-red/10 text-christ-red',
}

export function ChallengePanel({
  circuit,
  validation,
}: {
  circuit: Circuit
  validation: ValidationResult
}) {
  const [selectedId, setSelectedId] = useState(CHALLENGES[0].id)
  const [completed, setCompleted] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPLETED_KEY)
      if (raw) setCompleted(JSON.parse(raw) as string[])
    } catch {
      // Corrupted save — start fresh, the bench still works.
    }
  }, [])

  const challenge = CHALLENGES.find((c) => c.id === selectedId) ?? CHALLENGES[0]
  const result = useMemo(
    () => challenge.check(circuit, validation),
    [challenge, circuit, validation],
  )

  // Record a freshly earned completion.
  useEffect(() => {
    if (!result.complete || completed.includes(challenge.id)) return
    const next = [...completed, challenge.id]
    setCompleted(next)
    try {
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable — completion just won't persist.
    }
  }, [result.complete, challenge.id, completed])

  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-display font-semibold text-christ-navy">Wiring Challenges</h2>
        <span className="font-mono text-[10px] font-bold text-christ-gold border border-christ-gold/30 px-1.5 py-0.5 rounded-full">
          {completed.length}/{CHALLENGES.length}
        </span>
      </div>

      {/* Challenge picker */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CHALLENGES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedId(c.id)
              setShowHint(false)
            }}
            className={cn(
              'flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-body transition-colors',
              c.id === selectedId
                ? 'border-christ-saffron bg-christ-saffron/10 text-christ-saffron'
                : 'border-christ-navy/15 text-christ-navy/60 hover:border-christ-saffron/40',
            )}
          >
            {completed.includes(c.id) && <Trophy className="h-3 w-3 text-christ-gold" />}
            {c.title}
          </button>
        ))}
      </div>

      {/* Selected challenge */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full', DIFFICULTY_STYLES[challenge.difficulty])}>
            {challenge.difficulty}
          </span>
          {completed.includes(challenge.id) && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-christ-gold/10 text-christ-gold">
              completed
            </span>
          )}
        </div>
        <p className="text-xs font-body text-christ-navy/70">{challenge.brief}</p>

        <ul className="space-y-1">
          {result.requirements.map((r) => (
            <li
              key={r.id}
              className={cn(
                'flex items-start gap-1.5 text-xs font-body',
                r.met ? 'text-christ-green' : 'text-christ-navy/50',
              )}
            >
              {r.met ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              )}
              <span>{r.label}</span>
            </li>
          ))}
        </ul>

        {result.complete ? (
          <p className="rounded-md bg-christ-green/10 px-3 py-2 text-xs font-body text-christ-green">
            🎉 Challenge complete! Press Run Simulation to see it working, or pick the next one.
          </p>
        ) : (
          <button
            onClick={() => setShowHint((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-body text-christ-saffron hover:underline"
          >
            <Lightbulb className="h-3 w-3" />
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        )}
        {showHint && !result.complete && (
          <p className="rounded-md bg-christ-bg px-3 py-2 text-[11px] font-body text-christ-navy/60">
            {challenge.hint}
          </p>
        )}
      </div>
    </div>
  )
}
