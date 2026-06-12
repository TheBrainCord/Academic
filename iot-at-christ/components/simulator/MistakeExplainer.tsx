'use client'

import { Flame, Wrench, X, Zap, HardHat } from 'lucide-react'
import type { TriggeredFailure } from '@/lib/simulator/failure-lessons'

// Shown AFTER a failure run finishes: the student has already watched the
// smoke/sparks/dead parts on the bench — now we explain each mistake.
export function MistakeExplainer({
  failures,
  open,
  onClose,
}: {
  failures: TriggeredFailure[]
  open: boolean
  onClose: () => void
}) {
  if (!open || failures.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-christ-navy/60 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="What went wrong"
    >
      <div
        className="w-full sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-christ-navy/10 px-4 py-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-christ-navy flex items-center gap-2">
              <Flame className="h-4 w-4 text-christ-red" />
              What just happened on your bench
            </h2>
            <p className="text-[11px] font-body text-christ-navy/50 mt-0.5">
              {failures.length === 1
                ? 'You watched 1 thing go wrong — here is the engineering behind it.'
                : `You watched ${failures.length} things go wrong — here is the engineering behind each one.`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-christ-navy/50 hover:bg-christ-bg hover:text-christ-red transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          {failures.map(({ lesson }) => (
            <article key={lesson.code} className="rounded-lg border border-christ-navy/10 overflow-hidden">
              <header className="bg-christ-red/5 border-b border-christ-red/15 px-3 py-2">
                <h3 className="font-display font-semibold text-sm text-christ-red">{lesson.headline}</h3>
                <p className="text-xs font-body text-christ-navy/70 mt-0.5 italic">{lesson.whatYouSaw}</p>
              </header>
              <div className="px-3 py-2.5 space-y-2.5">
                <section>
                  <h4 className="flex items-center gap-1.5 text-[10px] font-display font-semibold text-christ-navy uppercase tracking-wide mb-0.5">
                    <Zap className="h-3 w-3 text-christ-saffron" /> Why it happened
                  </h4>
                  <p className="text-xs font-body text-christ-navy/70">{lesson.why}</p>
                </section>
                <section>
                  <h4 className="flex items-center gap-1.5 text-[10px] font-display font-semibold text-christ-navy uppercase tracking-wide mb-0.5">
                    <Wrench className="h-3 w-3 text-christ-green" /> How to fix it
                  </h4>
                  <p className="text-xs font-body text-christ-navy/70">{lesson.fix}</p>
                </section>
                <section className="rounded-md bg-christ-bg px-2.5 py-2">
                  <h4 className="flex items-center gap-1.5 text-[10px] font-display font-semibold text-christ-gold uppercase tracking-wide mb-0.5">
                    <HardHat className="h-3 w-3" /> On real hardware
                  </h4>
                  <p className="text-[11px] font-body text-christ-navy/60">{lesson.onRealHardware}</p>
                </section>
              </div>
            </article>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-christ-navy/10 px-4 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-md bg-christ-green px-4 py-2.5 text-sm font-body font-semibold text-white hover:bg-christ-green/90 transition-colors"
          >
            Back to the bench — fix the wiring
          </button>
        </div>
      </div>
    </div>
  )
}
