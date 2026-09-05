'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Expand,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  TimerReset,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  TeachingDeck,
  TeachingDeckCard,
  TeachingDeckOption,
  TeachingSlideKind,
} from '@/types/teaching-decks'

const KIND_STYLES: Record<TeachingSlideKind, { label: string; classes: string }> = {
  hook: { label: 'Predict', classes: 'bg-christ-saffron/10 text-christ-saffron' },
  plan: { label: 'Teaching route', classes: 'bg-christ-navy/10 text-christ-navy' },
  concept: { label: 'Explore', classes: 'bg-blue-100 text-blue-900' },
  compare: { label: 'Decide', classes: 'bg-christ-gold/15 text-christ-gold' },
  activity: { label: 'Build', classes: 'bg-christ-green/10 text-christ-green' },
  code: { label: 'Trace code', classes: 'bg-research-bg/10 text-research-bg' },
  quiz: { label: 'Check', classes: 'bg-christ-red/10 text-christ-red' },
  exit: { label: 'Exit ticket', classes: 'bg-christ-navy/10 text-christ-navy' },
}

const CARD_ACCENTS: Record<NonNullable<TeachingDeckCard['accent']>, string> = {
  navy: 'border-christ-navy/30 bg-christ-navy/5',
  saffron: 'border-christ-saffron/40 bg-christ-saffron/5',
  green: 'border-christ-green/35 bg-christ-green/5',
  gold: 'border-christ-gold/40 bg-christ-gold/5',
  red: 'border-christ-red/35 bg-christ-red/5',
  blue: 'border-blue-300 bg-blue-50',
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function Feedback({ option }: { option: TeachingDeckOption }) {
  return (
    <div
      className={cn(
        'mt-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
        option.correct
          ? 'border-christ-green/30 bg-christ-green/5 text-christ-green'
          : 'border-christ-red/20 bg-christ-red/5 text-christ-navy/75',
      )}
      role="status"
    >
      {option.feedback}
    </div>
  )
}

export function TeachingDeckViewer({ deck }: { deck: TeachingDeck }) {
  const storageKey = `iot-at-christ:teaching-deck:${deck.id}:v1`
  const [index, setIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(deck.slides[0].durationMinutes * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [teacherNotesOpen, setTeacherNotesOpen] = useState(false)
  const [selectedFlow, setSelectedFlow] = useState(0)
  const [selectedCard, setSelectedCard] = useState(0)
  const [pollChoice, setPollChoice] = useState<number | null>(null)
  const [quizChoices, setQuizChoices] = useState<Record<number, number>>({})
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({})
  const [openCodeStep, setOpenCodeStep] = useState(0)

  const slide = deck.slides[index]
  const kind = KIND_STYLES[slide.kind]

  const completedMinutes = deck.slides
    .slice(0, index)
    .reduce((total, item) => total + item.durationMinutes, 0)

  const resetSlideInteractions = useCallback(() => {
    setTimerSeconds(deck.slides[index].durationMinutes * 60)
    setTimerRunning(false)
    setTeacherNotesOpen(false)
    setSelectedFlow(0)
    setSelectedCard(0)
    setPollChoice(null)
    setQuizChoices({})
    setCheckedItems({})
    setOpenCodeStep(0)
  }, [deck.slides, index])

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(storageKey))
      if (Number.isInteger(saved) && saved > 0 && saved < deck.slides.length) setIndex(saved)
    } catch {
      // Storage is optional; the deck simply starts from the first slide.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  useEffect(() => {
    resetSlideInteractions()
  }, [resetSlideInteractions])

  useEffect(() => {
    if (!timerRunning) return
    const timer = window.setInterval(() => {
      setTimerSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning])

  useEffect(() => {
    if (timerSeconds === 0) setTimerRunning(false)
  }, [timerSeconds])

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(deck.slides.length - 1, next))
      setIndex(clamped)
      try {
        window.localStorage.setItem(storageKey, String(clamped))
      } catch {
        // Progress persistence is a convenience, not a requirement.
      }
    },
    [deck.slides.length, storageKey],
  )

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(index + 1)
      if (event.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [go, index])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Some embedded browsers do not allow fullscreen; the deck remains usable.
    }
  }

  return (
    <article className="mx-auto max-w-6xl space-y-4">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/learn"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-christ-navy/60 transition hover:bg-white hover:text-christ-saffron"
          >
            <ArrowLeft className="h-4 w-4" /> All learning
          </Link>
          <span className="ml-auto rounded-full bg-christ-navy/5 px-3 py-1.5 font-mono text-xs text-christ-navy/55">
            UNIT {deck.unit} · SESSION {deck.session}
          </span>
          <button
            type="button"
            onClick={enterFullscreen}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-christ-navy/15 bg-white px-3 text-sm font-semibold text-christ-navy transition hover:border-christ-saffron/50"
          >
            <Expand className="h-4 w-4" /> Present
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-display font-bold text-christ-navy sm:text-3xl">
            {deck.icon} {deck.title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-christ-navy/60">{deck.subtitle}</p>
        </div>
      </header>

      <div className="rounded-2xl border border-christ-navy/10 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex items-center gap-1.5" aria-label="Slide progress">
          {deck.slides.map((item, slideIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(slideIndex)}
              aria-label={`Open slide ${slideIndex + 1}: ${item.title}`}
              className={cn(
                'h-2 min-w-4 flex-1 rounded-full transition',
                slideIndex < index
                  ? 'bg-christ-green/55'
                  : slideIndex === index
                    ? 'bg-christ-saffron'
                    : 'bg-christ-navy/10 hover:bg-christ-navy/20',
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className={cn('rounded-full px-2.5 py-1 font-semibold', kind.classes)}>{kind.label}</span>
          <span className="text-christ-navy/45">Slide {index + 1}/{deck.slides.length}</span>
          <span className="text-christ-navy/45">Class time {completedMinutes}–{completedMinutes + slide.durationMinutes} min</span>

          <div className="ml-auto flex items-center gap-1 rounded-xl bg-christ-navy px-2 py-1 text-white">
            <Clock3 className="h-4 w-4 text-christ-saffron" />
            <span className={cn('w-12 font-mono text-sm font-bold', timerSeconds === 0 && 'text-christ-saffron')}>
              {formatTime(timerSeconds)}
            </span>
            <button
              type="button"
              onClick={() => setTimerRunning((running) => !running)}
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"
              aria-label={timerRunning ? 'Pause slide timer' : 'Start slide timer'}
            >
              {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false)
                setTimerSeconds(slide.durationMinutes * 60)
              }}
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10"
              aria-label="Reset slide timer"
            >
              <TimerReset className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <section className="min-h-[520px] rounded-2xl border border-christ-navy/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-wrap items-start gap-3 border-b border-christ-navy/10 pb-5">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-widest text-christ-saffron">{slide.label} · {slide.durationMinutes} min</p>
            <h2 className="mt-1 text-2xl font-display font-bold text-christ-navy sm:text-3xl">{slide.title}</h2>
            {slide.subtitle && <p className="mt-2 max-w-4xl text-base leading-relaxed text-christ-navy/60">{slide.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => setTeacherNotesOpen((open) => !open)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-christ-saffron/30 bg-christ-saffron/5 px-3 text-sm font-semibold text-christ-navy transition hover:bg-christ-saffron/10"
          >
            <Lightbulb className="h-4 w-4 text-christ-saffron" /> Teacher cue
            <ChevronDown className={cn('h-4 w-4 transition-transform', teacherNotesOpen && 'rotate-180')} />
          </button>
        </div>

        {teacherNotesOpen && (
          <div className="mb-5 grid gap-3 rounded-2xl border border-christ-saffron/25 bg-christ-saffron/5 p-4 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-christ-gold">Say or do</p>
              <p className="mt-1 text-sm leading-relaxed text-christ-navy/75">{slide.teacherPrompt}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-christ-green">Visible student evidence</p>
              <p className="mt-1 text-sm leading-relaxed text-christ-navy/75">{slide.studentOutcome}</p>
            </div>
          </div>
        )}

        {slide.kind === 'plan' && (
          <div className="mb-6 grid gap-3 lg:grid-cols-3">
            <DeckList title="Learning outcomes" items={deck.objectives} icon={<CheckCircle2 className="h-5 w-5" />} />
            <DeckList title="Equipment" items={deck.equipment} icon={<Users className="h-5 w-5" />} />
            <DeckList title="Before class" items={deck.preparation} icon={<RotateCcw className="h-5 w-5" />} />
          </div>
        )}

        {slide.timeline && (
          <div className="space-y-2">
            {slide.timeline.map((item) => (
              <div key={`${item.minutes}-${item.title}`} className="grid gap-2 rounded-xl border border-christ-navy/10 p-3 sm:grid-cols-[80px_1fr_1fr] sm:items-center">
                <span className="w-fit rounded-lg bg-christ-navy px-2.5 py-1 font-mono text-xs font-bold text-white">{item.minutes}</span>
                <div>
                  <p className="font-display font-bold text-christ-navy">{item.title}</p>
                  <p className="mt-0.5 text-xs text-christ-navy/55">{item.teacherAction}</p>
                </div>
                <p className="rounded-lg bg-christ-green/5 px-3 py-2 text-xs leading-relaxed text-christ-navy/70">
                  <strong className="text-christ-green">Evidence:</strong> {item.studentEvidence}
                </p>
              </div>
            ))}
          </div>
        )}

        {slide.flow && slide.flow.length > 0 && (
          <div className="mb-6">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slide.flow.map((step, flowIndex) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setSelectedFlow(flowIndex)}
                  className={cn(
                    'min-h-14 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition',
                    selectedFlow === flowIndex
                      ? 'border-christ-saffron bg-christ-saffron text-white shadow-sm'
                      : 'border-christ-navy/10 bg-christ-bg text-christ-navy hover:border-christ-saffron/40',
                  )}
                >
                  {step.label}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-christ-navy p-5 text-white">
              <p className="text-base leading-relaxed">{slide.flow[selectedFlow].detail}</p>
              {slide.flow[selectedFlow].packet && (
                <p className="mt-3 overflow-x-auto rounded-xl bg-black/20 px-4 py-3 font-mono text-sm text-christ-saffron">
                  {slide.flow[selectedFlow].packet}
                </p>
              )}
            </div>
          </div>
        )}

        {slide.cards && slide.cards.length > 0 && (
          <div className="mb-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {slide.cards.map((card, cardIndex) => (
                <button
                  key={`${card.title}-${cardIndex}`}
                  type="button"
                  onClick={() => setSelectedCard(cardIndex)}
                  className={cn(
                    'min-h-28 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm',
                    CARD_ACCENTS[card.accent ?? 'navy'],
                    selectedCard === cardIndex && 'ring-2 ring-christ-saffron ring-offset-2',
                  )}
                >
                  {card.kicker && <span className="font-mono text-[10px] uppercase tracking-wider text-christ-navy/45">{card.kicker}</span>}
                  <span className="mt-1 block font-display text-base font-bold text-christ-navy">{card.title}</span>
                  <span className="mt-2 block text-xs leading-relaxed text-christ-navy/65 sm:hidden">{card.body}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 hidden rounded-xl border-l-4 border-christ-saffron bg-christ-bg px-4 py-3 text-sm leading-relaxed text-christ-navy/75 sm:block">
              <strong className="text-christ-navy">{slide.cards[selectedCard].title}:</strong> {slide.cards[selectedCard].body}
            </div>
          </div>
        )}

        {slide.poll && (
          <ChoicePanel
            question={slide.poll.question}
            options={slide.poll.options}
            selected={pollChoice}
            onSelect={setPollChoice}
          />
        )}

        {slide.build && (
          <div className="mb-6 space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-christ-navy to-blue-950 p-5 text-white">
              <p className="font-mono text-[11px] uppercase tracking-widest text-christ-saffron">Classroom project</p>
              <h3 className="mt-1 text-xl font-display font-bold">{slide.build.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{slide.build.outcome}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {slide.build.dataPath.map((item, pathIndex) => (
                  <div key={`${item}-${pathIndex}`} className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold">{item}</span>
                    {pathIndex < slide.build!.dataPath.length - 1 && <ArrowRight className="h-4 w-4 text-christ-saffron" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-xl border border-christ-navy/10 p-4">
                <h4 className="font-display font-bold text-christ-navy">Hardware</h4>
                <ul className="mt-2 space-y-2">
                  {slide.build.hardware.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-christ-navy/70"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-christ-green" />{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-christ-navy/10 p-4">
                <h4 className="font-display font-bold text-christ-navy">Build sequence</h4>
                <ol className="mt-2 space-y-2">
                  {slide.build.steps.map((item, stepIndex) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-christ-navy/70">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-christ-saffron text-xs font-bold text-white">{stepIndex + 1}</span>{item}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {(slide.build.extension || slide.build.safety) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {slide.build.extension && <p className="rounded-xl bg-blue-50 p-4 text-sm leading-relaxed text-blue-950"><strong>Extension:</strong> {slide.build.extension}</p>}
                {slide.build.safety && <p className="rounded-xl bg-christ-red/5 p-4 text-sm leading-relaxed text-christ-navy"><strong className="text-christ-red">Safety:</strong> {slide.build.safety}</p>}
              </div>
            )}
          </div>
        )}

        {slide.code && (
          <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-2xl border border-christ-navy/15">
              <div className="flex items-center gap-2 bg-christ-navy px-4 py-2 text-white">
                <span className="h-2.5 w-2.5 rounded-full bg-christ-red" />
                <span className="h-2.5 w-2.5 rounded-full bg-christ-gold" />
                <span className="h-2.5 w-2.5 rounded-full bg-christ-green" />
                <span className="ml-2 font-mono text-xs text-white/70">{slide.code.filename}</span>
              </div>
              <pre className="max-h-[560px] overflow-auto bg-research-bg p-4 font-mono text-xs leading-relaxed text-research-amber">
                {slide.code.listing}
              </pre>
            </div>
            <div className="space-y-2">
              {slide.code.walkthrough.map((step, stepIndex) => {
                const open = stepIndex === openCodeStep
                return (
                  <div key={step.label} className="overflow-hidden rounded-xl border border-christ-navy/10">
                    <button
                      type="button"
                      onClick={() => setOpenCodeStep(stepIndex)}
                      className="flex min-h-12 w-full items-center gap-3 px-3 text-left transition hover:bg-christ-bg"
                    >
                      <span className="rounded-md bg-christ-saffron/10 px-2 py-1 font-mono text-[10px] text-christ-saffron">{step.label}</span>
                      <span className="flex-1 text-sm font-bold text-christ-navy">{step.title}</span>
                      <ChevronDown className={cn('h-4 w-4 text-christ-navy/40 transition-transform', open && 'rotate-180')} />
                    </button>
                    {open && <p className="border-t border-christ-navy/5 px-4 py-3 text-sm leading-relaxed text-christ-navy/70">{step.detail}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {slide.questions && (
          <div className="space-y-5">
            {slide.questions.map((question, questionIndex) => {
              const selected = quizChoices[questionIndex]
              return (
                <ChoicePanel
                  key={question.prompt}
                  question={`${questionIndex + 1}. ${question.prompt}`}
                  options={question.options}
                  selected={selected ?? null}
                  onSelect={(choice) => setQuizChoices((current) => ({ ...current, [questionIndex]: choice }))}
                />
              )
            })}
          </div>
        )}

        {slide.checklist && (
          <div className="rounded-2xl border border-christ-green/20 bg-christ-green/5 p-4">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-christ-green">Tap as evidence is completed</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slide.checklist.map((item, itemIndex) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCheckedItems((current) => ({ ...current, [itemIndex]: !current[itemIndex] }))}
                  className={cn(
                    'flex min-h-12 items-center gap-3 rounded-xl border px-3 text-left text-sm transition',
                    checkedItems[itemIndex]
                      ? 'border-christ-green bg-christ-green text-white'
                      : 'border-christ-green/20 bg-white text-christ-navy/70 hover:border-christ-green/50',
                  )}
                >
                  <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-md border', checkedItems[itemIndex] ? 'border-white/50' : 'border-christ-navy/20')}>
                    {checkedItems[itemIndex] && <Check className="h-4 w-4" />}
                  </span>
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <nav className="flex items-center justify-between gap-3 pb-4" aria-label="Deck navigation">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className={cn(
            'inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition',
            index === 0
              ? 'cursor-not-allowed border-christ-navy/10 text-christ-navy/25'
              : 'border-christ-navy/15 bg-white text-christ-navy hover:border-christ-saffron/50',
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        {index === deck.slides.length - 1 ? (
          <Link
            href="/learn"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-christ-green px-4 text-sm font-bold text-white transition hover:bg-christ-green/90"
          >
            Deck complete <CheckCircle2 className="h-4 w-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-christ-saffron px-5 text-sm font-bold text-white transition hover:bg-christ-saffron/90"
          >
            Next slide <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </nav>
    </article>
  )
}

function DeckList({ title, items, icon }: { title: string; items: string[]; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-christ-navy/10 bg-christ-bg p-4">
      <h3 className="flex items-center gap-2 font-display font-bold text-christ-navy">{icon}{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => <li key={item} className="text-xs leading-relaxed text-christ-navy/65">• {item}</li>)}
      </ul>
    </div>
  )
}

function ChoicePanel({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string
  options: TeachingDeckOption[]
  selected: number | null
  onSelect: (index: number) => void
}) {
  return (
    <div className="mb-6 rounded-2xl border border-christ-navy/10 bg-christ-bg p-4 sm:p-5">
      <p className="font-display text-lg font-bold text-christ-navy">{question}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {options.map((option, optionIndex) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onSelect(optionIndex)}
            className={cn(
              'min-h-14 rounded-xl border px-3 py-2 text-sm font-semibold transition',
              selected === optionIndex
                ? option.correct
                  ? 'border-christ-green bg-christ-green text-white'
                  : 'border-christ-red bg-christ-red text-white'
                : 'border-christ-navy/15 bg-white text-christ-navy hover:border-christ-saffron/50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {selected !== null && <Feedback option={options[selected]} />}
    </div>
  )
}
