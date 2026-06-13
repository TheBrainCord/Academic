'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Code2, Play, RotateCcw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { runSketch, starterSketch, type CodeRunHandle } from '@/lib/simulator/codelab'
import type { Circuit } from '@/types/simulator'

// The Code Lab: a sketch editor whose digitalWrite/analogRead really act on
// the circuit wired on the bench. Students write the code they THINK runs
// the program; the bench shows them whether they were right.

interface CodeLabProps {
  circuit: Circuit
  /** The demo simulation is running — code runs are disabled meanwhile */
  demoRunning: boolean
  onSerial: (text: string) => void
  onActuators: (states: Record<string, boolean | number>) => void
  onRunningChange: (running: boolean) => void
}

const STORAGE_KEY = 'iot-at-christ:codelab:v1'

export function CodeLab({ circuit, demoRunning, onSerial, onActuators, onRunningChange }: CodeLabProps) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const handleRef = useRef<CodeRunHandle | null>(null)
  const hydratedRef = useRef(false)

  // Load saved sketch once; fall back to the board-appropriate starter.
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      setCode(saved || starterSketch(circuit))
    } catch {
      setCode(starterSketch(circuit))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydratedRef.current || !code) return
    try {
      window.localStorage.setItem(STORAGE_KEY, code)
    } catch {
      // fine — the sketch just won't persist
    }
  }, [code])

  // Stop the sketch if the component unmounts mid-run.
  useEffect(() => () => handleRef.current?.stop(), [])

  const setRun = (r: boolean) => {
    setRunning(r)
    onRunningChange(r)
  }

  const start = () => {
    if (running || demoRunning) return
    setStatus(null)
    setRun(true)
    handleRef.current = runSketch(code, circuit, {
      onSerial,
      onActuators,
      onDone: (reason) => {
        setStatus(reason)
        setRun(false)
        onActuators({})
      },
      onError: (message) => {
        setStatus(message)
        onSerial(`*** ${message}`)
        setRun(false)
        onActuators({})
      },
    })
  }

  const stop = () => {
    handleRef.current?.stop()
  }

  const resetTemplate = () => {
    if (running) return
    if (code.trim() && !window.confirm('Replace your sketch with the starter template?')) return
    setCode(starterSketch(circuit))
    setStatus(null)
  }

  return (
    <section className="rounded-lg border border-christ-navy/10 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-christ-bg transition-colors"
      >
        <Code2 className="h-4 w-4 text-christ-saffron shrink-0" />
        <span className="text-sm font-display font-semibold text-christ-navy flex-1">
          Code Lab — write the sketch yourself
        </span>
        {running && (
          <span className="inline-flex items-center gap-1 rounded-full bg-christ-green/10 px-2 py-0.5 text-[10px] font-mono text-christ-green">
            ● running
          </span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-christ-navy/40 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-christ-navy/10 p-3 space-y-2.5">
          <p className="text-[11px] font-body text-christ-navy/55">
            Your <span className="font-mono">digitalWrite</span> and <span className="font-mono">analogRead</span> act
            on the circuit above: writes only move parts that are actually wired to that pin, and reads return what the
            wired sensor measures. Output appears in the serial monitor.
          </p>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            disabled={running}
            rows={16}
            className={cn(
              'w-full rounded-lg border border-christ-navy/15 bg-research-bg text-research-amber',
              'px-3 py-2.5 text-xs font-mono leading-relaxed resize-y focus:outline-none',
              'focus:border-christ-saffron/60',
              running && 'opacity-60',
            )}
          />

          <div className="flex flex-wrap items-center gap-2">
            {running ? (
              <button
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-md bg-christ-red px-4 py-2 text-sm font-body text-white hover:bg-christ-red/90 transition-colors"
              >
                <Square className="h-4 w-4" /> Stop sketch
              </button>
            ) : (
              <button
                onClick={start}
                disabled={demoRunning}
                title={demoRunning ? 'Stop the demo simulation first' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-body text-white transition-colors',
                  demoRunning ? 'bg-christ-navy/30 cursor-not-allowed' : 'bg-christ-navy hover:bg-christ-navy/90',
                )}
              >
                <Play className="h-4 w-4" /> Run my code
              </button>
            )}
            <button
              onClick={resetTemplate}
              disabled={running}
              className="inline-flex items-center gap-1.5 rounded-md border border-christ-navy/20 bg-white px-3 py-2 text-xs font-body text-christ-navy/70 hover:border-christ-saffron/50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Starter template
            </button>
            {status && (
              <span className="text-[11px] font-mono text-christ-navy/50">— {status}</span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
