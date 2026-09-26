'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, RotateCcw, Save } from 'lucide-react'
import type { TeachingDeckCaseStudy } from '@/types/teaching-decks'

export function CaseStudyWorkspace({ caseStudy, deckId }: { caseStudy: TeachingDeckCaseStudy; deckId: string }) {
  const storageKey = `iot-at-christ:case-study:${deckId}:v1`
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) setAnswers(JSON.parse(raw))
    } catch {
      // Local persistence is optional; the worksheet remains fully usable.
    }
  }, [storageKey])

  const completed = useMemo(
    () => caseStudy.fields.filter((field) => (answers[field.id] ?? '').trim().length >= 20).length,
    [answers, caseStudy.fields],
  )

  const save = () => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(answers))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    } catch {
      setSaved(false)
    }
  }

  const reset = () => {
    setAnswers({})
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-christ-navy to-blue-950 p-5 text-white">
        <p className="font-mono text-[11px] uppercase tracking-widest text-christ-saffron">Scenario</p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">{caseStudy.scenario}</p>
        <div className="mt-4 rounded-xl bg-white/10 p-4">
          <p className="font-display text-lg font-bold">Your challenge</p>
          <p className="mt-1 text-sm leading-relaxed text-white/80">{caseStudy.challenge}</p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {caseStudy.requirements.map((item) => (
          <div key={item} className="flex gap-2 rounded-xl border border-christ-green/20 bg-christ-green/5 p-3 text-sm leading-relaxed text-christ-navy/75">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-christ-green" />
            {item}
          </div>
        ))}
      </div>

      <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-christ-navy/10 bg-white/95 p-3 shadow-sm backdrop-blur">
        <span className="text-sm font-semibold text-christ-navy">Architecture worksheet</span>
        <span className="rounded-full bg-christ-navy/5 px-2.5 py-1 font-mono text-xs text-christ-navy/60">
          {completed}/{caseStudy.fields.length} sections developed
        </span>
        <button type="button" onClick={save} className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg bg-christ-saffron px-3 text-sm font-bold text-white">
          <Save className="h-4 w-4" /> {saved ? 'Saved' : 'Save locally'}
        </button>
        <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-christ-navy/15 px-3 text-sm font-semibold text-christ-navy">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      <div className="space-y-4">
        {caseStudy.fields.map((field) => (
          <label key={field.id} className="block rounded-2xl border border-christ-navy/10 bg-white p-4">
            <span className="font-display text-lg font-bold text-christ-navy">{field.label}</span>
            <span className="mt-1 block text-sm leading-relaxed text-christ-navy/60">{field.prompt}</span>
            <textarea
              value={answers[field.id] ?? ''}
              onChange={(event) => setAnswers((current) => ({ ...current, [field.id]: event.target.value }))}
              placeholder={field.placeholder}
              rows={4}
              className="mt-3 w-full resize-y rounded-xl border border-christ-navy/15 bg-christ-bg p-3 text-sm leading-relaxed text-christ-navy outline-none transition focus:border-christ-saffron focus:ring-2 focus:ring-christ-saffron/15"
            />
          </label>
        ))}
      </div>

      <section className="rounded-2xl border border-christ-saffron/25 bg-christ-saffron/5 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-christ-saffron">Your architecture at a glance</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            ['Sensors', answers.sensors],
            ['Controller', answers.controllers],
            ['Connectivity', answers.communication],
            ['Edge', answers.edge],
            ['AI', answers.ai],
            ['Cloud', answers.cloud],
            ['Security', answers.security],
            ['Resilience', answers.failure],
          ].map(([label, value], index, array) => (
            <div key={label} className="flex items-center gap-2">
              <div className="max-w-[190px] rounded-xl border border-christ-navy/10 bg-white px-3 py-2">
                <p className="font-mono text-[10px] uppercase tracking-wider text-christ-navy/40">{label}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-christ-navy/75">
                  {(value ?? '').trim() || 'Not decided yet'}
                </p>
              </div>
              {index < array.length - 1 && <span className="text-christ-saffron">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-christ-navy/10 bg-christ-bg p-5">
        <p className="font-display text-lg font-bold text-christ-navy">Final reflection</p>
        <ul className="mt-3 space-y-2">
          {caseStudy.reflectionQuestions.map((question) => (
            <li key={question} className="rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-christ-navy/70">
              • {question}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
