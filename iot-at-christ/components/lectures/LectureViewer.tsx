'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Cable,
  ChevronDown,
  Clock,
  Cpu,
  FlaskConical,
  ListChecks,
  Rocket,
  TerminalSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LectureModule } from '@/types/lectures'

// Slide-based lecture player: replaces the PPT. Every module becomes an
// ordered deck — overview → each physics concept → wiring → code → research —
// so the teacher can walk the class step by step without losing context.

type SlideKind = 'overview' | 'physics' | 'wiring' | 'code' | 'research'

interface Slide {
  kind: SlideKind
  /** Index into physics.concepts when kind === 'physics' */
  conceptIndex?: number
}

const PART_BADGE: Record<SlideKind, { label: string; icon: typeof Atom; tone: string }> = {
  overview: { label: 'Module overview', icon: ListChecks, tone: 'text-christ-navy bg-christ-navy/10' },
  physics: { label: 'Part 1 · Hardware physics from scratch', icon: Atom, tone: 'text-christ-saffron bg-christ-saffron/10' },
  wiring: { label: 'Part 2 · Simulator wiring & setup', icon: Cable, tone: 'text-christ-green bg-christ-green/10' },
  code: { label: 'Part 3 · Code execution breakdown', icon: TerminalSquare, tone: 'text-christ-navy bg-christ-navy/10' },
  research: { label: 'Part 4 · M.Sc. research spark', icon: Rocket, tone: 'text-christ-gold bg-christ-gold/10' },
}

function AsciiBlock({ art, caption }: { art: string; caption: string }) {
  return (
    <figure className="rounded-lg overflow-hidden border border-christ-navy/15">
      <pre className="bg-research-bg text-research-amber px-3 py-3 text-[10.5px] sm:text-xs font-mono leading-snug overflow-x-auto">
        {art}
      </pre>
      <figcaption className="bg-christ-bg px-3 py-1.5 text-[11px] font-body text-christ-navy/60">
        {caption}
      </figcaption>
    </figure>
  )
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i} className="text-sm font-body text-christ-navy/75 leading-relaxed">
          {p}
        </p>
      ))}
    </>
  )
}

export function LectureViewer({ module: mod }: { module: LectureModule }) {
  const slides = useMemo<Slide[]>(
    () => [
      { kind: 'overview' },
      ...mod.physics.concepts.map((_, i) => ({ kind: 'physics' as const, conceptIndex: i })),
      { kind: 'wiring' },
      { kind: 'code' },
      { kind: 'research' },
    ],
    [mod],
  )
  const storageKey = `iot-at-christ:lecture:${mod.id}:v1`
  const [index, setIndex] = useState(0)
  const [openWalkStep, setOpenWalkStep] = useState<number | null>(0)

  // Resume where the class left off.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      const saved = raw === null ? NaN : Number(raw)
      if (Number.isInteger(saved) && saved > 0 && saved < slides.length) setIndex(saved)
    } catch {
      // storage unavailable — always start at the overview
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, next))
      setIndex(clamped)
      setOpenWalkStep(0)
      try {
        window.localStorage.setItem(storageKey, String(clamped))
      } catch {
        // fine — progress just won't persist
      }
    },
    [slides.length, storageKey],
  )

  // Arrow keys drive the deck, exactly like a slideshow.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(index + 1)
      if (e.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index])

  const slide = slides[index]
  const badge = PART_BADGE[slide.kind]
  const BadgeIcon = badge.icon

  return (
    <div className="space-y-4">
      {/* Deck header */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1 text-xs font-body text-christ-navy/50 hover:text-christ-saffron transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Unit {mod.unit} modules
        </Link>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-christ-navy/40">
          <Clock className="h-3 w-3" /> ~{mod.minutes} min
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-christ-navy/40">
          <Cpu className="h-3 w-3" /> {mod.board}
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-christ-navy">
          {mod.icon} {mod.title}
        </h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1">{mod.subtitle}</p>
      </div>

      {/* Progress rail */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Step ${i + 1}`}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                i < index ? 'bg-christ-saffron/50' : i === index ? 'bg-christ-saffron' : 'bg-christ-navy/10 hover:bg-christ-navy/20',
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-body', badge.tone)}>
            <BadgeIcon className="h-3.5 w-3.5" /> {badge.label}
          </span>
          <span className="text-[11px] font-mono text-christ-navy/40">
            step {index + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Slide body */}
      <div className="rounded-xl border border-christ-navy/10 bg-white p-4 sm:p-6 min-h-[340px]">
        {slide.kind === 'overview' && (
          <div className="space-y-4">
            <Paragraphs text={mod.physics.intro} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['physics', 'wiring', 'code', 'research'] as const).map((kind) => {
                const b = PART_BADGE[kind]
                const Icon = b.icon
                const detail =
                  kind === 'physics'
                    ? `${mod.physics.concepts.length} concepts, from electrons up`
                    : kind === 'wiring'
                      ? `${mod.wiring.steps.length} connections on the ${mod.board}`
                      : kind === 'code'
                        ? `${mod.code.language === 'cpp' ? 'C++ (Arduino)' : 'Python'} with a register-level walkthrough`
                        : mod.research.title
                return (
                  <div key={kind} className="rounded-lg border border-christ-navy/10 px-3 py-2.5 flex items-start gap-2.5">
                    <Icon className="h-4 w-4 text-christ-saffron shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-display font-semibold text-christ-navy">{b.label}</p>
                      <p className="text-[11px] font-body text-christ-navy/55 mt-0.5">{detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] font-body text-christ-navy/40">
              Tip for the classroom: use ← and → arrow keys to drive the deck. Your position is saved per module.
            </p>
          </div>
        )}

        {slide.kind === 'physics' && slide.conceptIndex !== undefined && (
          <div className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-christ-navy">
              {mod.physics.concepts[slide.conceptIndex].heading}
            </h2>
            <div className="space-y-3">
              <Paragraphs text={mod.physics.concepts[slide.conceptIndex].body} />
            </div>
            {mod.physics.concepts[slide.conceptIndex].diagram && (
              <AsciiBlock
                art={mod.physics.concepts[slide.conceptIndex].diagram!.art}
                caption={mod.physics.concepts[slide.conceptIndex].diagram!.caption}
              />
            )}
          </div>
        )}

        {slide.kind === 'wiring' && (
          <div className="space-y-4">
            <Paragraphs text={mod.wiring.intro} />
            <ol className="space-y-2">
              {mod.wiring.steps.map((s, i) => (
                <li key={i} className="rounded-lg border border-christ-navy/10 px-3 py-2.5">
                  <p className="text-xs font-mono font-bold text-christ-navy">
                    <span className="text-christ-saffron">{i + 1}.</span> {s.from}{' '}
                    <span className="text-christ-navy/40">→</span> {s.to}
                  </p>
                  <p className="text-xs font-body text-christ-navy/60 mt-1">{s.purpose}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-lg border border-christ-green/30 bg-christ-green/5 px-3 py-2.5 space-y-2">
              <p className="text-xs font-body text-christ-navy/70">
                <FlaskConical className="inline h-3.5 w-3.5 text-christ-green mr-1" />
                {mod.wiring.labNote}
              </p>
              <Link
                href="/lab"
                className="inline-flex items-center gap-1.5 rounded-md bg-christ-green px-3 py-1.5 text-xs font-body font-semibold text-white hover:bg-christ-green/90 transition-colors"
              >
                Open the Virtual Lab <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {slide.kind === 'code' && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border border-christ-navy/15">
              <div className="flex items-center gap-1.5 bg-christ-navy/90 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-christ-red/70" />
                <span className="h-2 w-2 rounded-full bg-christ-gold/70" />
                <span className="h-2 w-2 rounded-full bg-christ-green/70" />
                <span className="ml-2 text-[11px] font-mono text-white/70">
                  {mod.code.language === 'cpp' ? 'sketch.ino — paste & run' : 'script.py — paste & run'}
                </span>
              </div>
              <pre className="bg-research-bg text-research-amber px-3 py-3 text-[10.5px] sm:text-xs font-mono leading-snug overflow-x-auto max-h-[420px]">
                {mod.code.listing}
              </pre>
            </div>

            <div>
              <h3 className="text-xs font-display font-semibold text-christ-navy uppercase tracking-wide mb-2">
                What actually executes — step by step
              </h3>
              <div className="space-y-1.5">
                {mod.code.walkthrough.map((step, i) => {
                  const open = openWalkStep === i
                  return (
                    <div key={i} className="rounded-lg border border-christ-navy/10 overflow-hidden">
                      <button
                        onClick={() => setOpenWalkStep(open ? null : i)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-christ-bg transition-colors"
                      >
                        <span className="font-mono text-[10px] text-christ-saffron whitespace-nowrap">{step.lines}</span>
                        <span className="text-xs font-display font-semibold text-christ-navy flex-1">{step.heading}</span>
                        <ChevronDown className={cn('h-4 w-4 text-christ-navy/40 transition-transform', open && 'rotate-180')} />
                      </button>
                      {open && (
                        <p className="px-3 pb-3 text-xs font-body text-christ-navy/70 leading-relaxed">{step.body}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {slide.kind === 'research' && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-semibold text-christ-navy">🚀 {mod.research.title}</h2>
            <Paragraphs text={mod.research.brief} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-christ-navy/10 px-3 py-2.5">
                <h3 className="text-[10px] font-display font-semibold text-christ-green uppercase tracking-wide mb-1.5">
                  Research objectives
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {mod.research.objectives.map((o, i) => (
                    <li key={i} className="text-xs font-body text-christ-navy/70">{o}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-christ-navy/10 px-3 py-2.5">
                <h3 className="text-[10px] font-display font-semibold text-christ-red uppercase tracking-wide mb-1.5">
                  Engineering constraints
                </h3>
                <ul className="list-disc pl-4 space-y-1">
                  {mod.research.constraints.map((c, i) => (
                    <li key={i} className="text-xs font-body text-christ-navy/70">{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-[11px] font-body text-christ-navy/45">
              Take it further in the <Link href="/ideas" className="text-christ-saffron hover:underline">Research Idea Bank</Link> —
              several curated ideas build directly on this module&apos;s hardware.
            </p>
          </div>
        )}
      </div>

      {/* Deck navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-body transition-colors',
            index === 0
              ? 'border-christ-navy/10 text-christ-navy/30 cursor-not-allowed'
              : 'border-christ-navy/20 bg-white text-christ-navy/70 hover:border-christ-saffron/50',
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        {index === slides.length - 1 ? (
          <Link
            href="/learn"
            className="inline-flex items-center gap-1.5 rounded-md bg-christ-green px-4 py-2 text-sm font-body font-semibold text-white hover:bg-christ-green/90 transition-colors"
          >
            Module complete — back to Unit 2 <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            onClick={() => go(index + 1)}
            className="inline-flex items-center gap-1.5 rounded-md bg-christ-saffron px-4 py-2 text-sm font-body font-semibold text-white hover:bg-christ-saffron/90 transition-colors"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
