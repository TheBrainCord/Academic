'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Code2, Play } from 'lucide-react'
import { getComponent } from '@/lib/simulator/components'
import { runSketch, type SketchRunResult } from '@/lib/simulator/sketch/run-sketch'
import { getSketchTemplates, languageForBoard } from '@/lib/simulator/sketch/templates'
import type { BoardDef, Circuit, PinDef, SensorReading } from '@/types/simulator'
import { SerialMonitor } from '@/components/simulator/SerialMonitor'
import { ReadingsPanel, type GaugedReading } from '@/components/simulator/ReadingsPanel'

const STORAGE_PREFIX = 'iot-at-christ:simulator:sketch:'

/** Short, student-facing summary of what a pin is for — used in the pinout reference. */
function pinSummary(pin: PinDef): string {
  const caps = pin.capabilities
  if (caps.includes('power-5v')) return '5V power rail'
  if (caps.includes('power-3v3')) return '3.3V power rail'
  if (caps.includes('ground')) return 'Ground (GND)'
  const parts: string[] = []
  if (caps.includes('i2c-sda')) parts.push('I2C data (SDA)')
  if (caps.includes('i2c-scl')) parts.push('I2C clock (SCL)')
  if (caps.includes('analog-in')) parts.push('Analog input')
  if (caps.includes('pwm')) parts.push('PWM output')
  if (caps.includes('gpio')) parts.push('Digital I/O')
  if (caps.includes('digital-input')) parts.push('Digital input only')
  if (caps.includes('digital-output')) parts.push('Digital output only')
  return parts.length > 0 ? parts.join(' / ') : 'I/O pin'
}

export function SketchEditor({
  board,
  circuit,
  onActuatorStates,
}: {
  board: BoardDef
  circuit: Circuit
  onActuatorStates: (states: Record<string, boolean | number> | null) => void
}) {
  const language = languageForBoard(board.id)
  const templates = useMemo(() => getSketchTemplates(board.id), [board.id])
  const storageKey = `${STORAGE_PREFIX}${board.id}`

  const [source, setSource] = useState(templates[0].code)
  const [hydrated, setHydrated] = useState(false)
  const [result, setResult] = useState<SketchRunResult | null>(null)

  // Load any saved code for this board; otherwise fall back to the first template.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(storageKey)
      setSource(saved ?? templates[0].code)
    } catch {
      setSource(templates[0].code)
    }
    setResult(null)
    onActuatorStates(null)
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, source)
    } catch {
      // Storage full/blocked — code still runs, it just won't persist.
    }
  }, [source, storageKey, hydrated])

  // Re-run results go stale the moment the bench changes.
  useEffect(() => {
    setResult(null)
    onActuatorStates(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circuit])

  const run = () => {
    const next = runSketch(source, language, circuit)
    setResult(next)
    onActuatorStates(next.ok ? next.output.actuatorStates : null)
  }

  const loadTemplate = (code: string) => {
    setSource(code)
    setResult(null)
    onActuatorStates(null)
  }

  const gaugedReadings: GaugedReading[] = useMemo(() => {
    if (!result) return []
    const out: GaugedReading[] = []
    for (const r of Object.values(result.output.readings) as SensorReading[]) {
      const placed = circuit.components.find((c) => c.instanceId === r.instanceId)
      const def = placed ? getComponent(placed.componentId) : undefined
      const range = def?.readings?.find((d) => d.label === r.label)
      out.push({ ...r, min: range?.min ?? 0, max: range?.max ?? Math.max(1, r.value) })
    }
    return out
  }, [result, circuit.components])

  const leftPins = board.pins.filter((p) => p.side === 'left').sort((a, b) => a.index - b.index)
  const rightPins = board.pins.filter((p) => p.side === 'right').sort((a, b) => a.index - b.index)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
      {/* Code editor */}
      <div className="lg:col-span-2 rounded-lg border border-christ-navy/10 bg-white p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-display font-semibold text-christ-navy">
            <Code2 className="h-3.5 w-3.5 text-christ-saffron" /> Write your own code
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wide text-christ-navy/40">
            {language === 'micropython' ? 'MicroPython' : 'Arduino C++'}
          </span>
        </div>
        <p className="text-xs font-body text-christ-navy/50">
          Write real {language === 'micropython' ? 'Python GPIO' : 'Arduino'} code and run it against the circuit you
          wired above — sensor readings and pin states reflect your actual wiring, just like real hardware.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTemplate(t.code)}
              title={t.description}
              className="rounded-full border border-christ-navy/15 bg-white px-2.5 py-1 text-[11px] font-body text-christ-navy/70 hover:border-christ-saffron/50 hover:text-christ-saffron transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          className="w-full h-56 rounded-md border border-christ-navy/15 bg-research-bg px-3 py-2 font-mono text-[12px] leading-relaxed text-christ-navy/90 focus:outline-none focus:ring-1 focus:ring-christ-saffron resize-y"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={run}
            className="inline-flex items-center gap-1.5 rounded-md bg-christ-green px-4 py-2 text-sm font-body text-white hover:bg-christ-green/90 transition-colors"
          >
            <Play className="h-4 w-4" /> Run Program
          </button>
          {result?.ok && (
            <span className="text-[11px] font-body text-christ-navy/40">
              Ran for {(result.outcome?.virtualMs ?? 0) / 1000}s of simulated time.
            </span>
          )}
        </div>

        {result && !result.ok && result.error && (
          <div className="flex items-start gap-1.5 rounded-md border border-christ-red/30 bg-christ-red/5 px-3 py-2 text-xs font-body text-christ-red">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              {result.error.line > 0 && <span className="font-mono">Line {result.error.line}: </span>}
              {result.error.message}
            </span>
          </div>
        )}

        {result && (
          <>
            <SerialMonitor lines={result.output.serial} boardName={board.name} />
            <ReadingsPanel readings={gaugedReadings} running={result.ok} />
          </>
        )}
      </div>

      {/* Pinout reference for the selected board */}
      <div className="rounded-lg border border-christ-navy/10 bg-white p-3 space-y-2">
        <h2 className="text-sm font-display font-semibold text-christ-navy">{board.name} — pinout</h2>
        <p className="text-xs font-body text-christ-navy/50">
          What each pin name in your code refers to on this board.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <h3 className="text-[10px] font-mono uppercase tracking-wide text-christ-navy/40">Left side</h3>
            {leftPins.map((p) => (
              <div key={p.id} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-christ-navy">{p.label}</span>
                <span className="text-right text-christ-navy/50 leading-tight">{pinSummary(p)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <h3 className="text-[10px] font-mono uppercase tracking-wide text-christ-navy/40">Right side</h3>
            {rightPins.map((p) => (
              <div key={p.id} className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-christ-navy">{p.label}</span>
                <span className="text-right text-christ-navy/50 leading-tight">{pinSummary(p)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
