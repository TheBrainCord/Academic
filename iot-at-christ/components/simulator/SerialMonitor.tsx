'use client'

import { useEffect, useRef } from 'react'
import type { SerialLine } from '@/types/simulator'

/** Failure-drama lines get highlighted so mistakes jump out of the log. */
function lineClass(text: string): string {
  if (text.includes('***') || /ERROR|BROWNOUT|failure|disabled|halted/i.test(text)) {
    return 'text-christ-red'
  }
  if (/WARNING|timeout|unstable|noise|corrupted|retrying/i.test(text)) {
    return 'text-christ-saffron'
  }
  return 'text-research-amber'
}

export function SerialMonitor({
  lines,
  boardName,
  onClear,
}: {
  lines: SerialLine[]
  boardName: string
  onClear?: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll the log container itself — scrollIntoView would yank the page.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="rounded-lg overflow-hidden border border-christ-navy/10">
      <div className="flex items-center gap-1.5 bg-christ-navy/90 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-christ-red/70" />
        <span className="h-2 w-2 rounded-full bg-christ-gold/70" />
        <span className="h-2 w-2 rounded-full bg-christ-green/70" />
        <span className="ml-2 text-[11px] font-mono text-white/70">Serial Monitor — {boardName}</span>
        {onClear && lines.length > 0 && (
          <button
            onClick={onClear}
            className="ml-auto text-[10px] font-mono text-white/50 hover:text-white transition-colors"
          >
            clear
          </button>
        )}
      </div>
      <div ref={scrollRef} className="bg-research-bg h-44 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {lines.length === 0 ? (
          <p className="text-research-amber/40">— serial monitor idle · 9600 baud —</p>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={lineClass(line.text)}>
              <span className="text-research-amber/40">[{line.tick}] </span>
              {line.text}
            </div>
          ))
        )}
        <span className="inline-block w-2 h-3 bg-research-amber/70 align-middle animate-pulse" aria-hidden />
      </div>
    </div>
  )
}
