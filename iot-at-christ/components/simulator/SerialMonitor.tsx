'use client'

import { useEffect, useRef } from 'react'
import type { SerialLine } from '@/types/simulator'

export function SerialMonitor({ lines, boardName }: { lines: SerialLine[]; boardName: string }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  return (
    <div className="rounded-lg overflow-hidden border border-christ-navy/10">
      <div className="flex items-center gap-1.5 bg-christ-navy/90 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-christ-red/70" />
        <span className="h-2 w-2 rounded-full bg-christ-gold/70" />
        <span className="h-2 w-2 rounded-full bg-christ-green/70" />
        <span className="ml-2 text-[11px] font-mono text-white/70">Serial Monitor — {boardName}</span>
      </div>
      <div className="bg-research-bg h-40 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-research-amber">
        {lines.length === 0 ? (
          <p className="text-research-amber/40">— serial monitor idle —</p>
        ) : (
          lines.map((line, i) => (
            <div key={i}>
              <span className="text-research-amber/40">[{line.tick}] </span>
              {line.text}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
