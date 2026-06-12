'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Flame, Info, Play, RotateCcw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOARDS, getBoard } from '@/lib/simulator/boards'
import { COMPONENTS, getComponent } from '@/lib/simulator/components'
import { validateCircuit } from '@/lib/simulator/validation'
import { simulateStep } from '@/lib/simulator/simulation'
import {
  failureEffectMap,
  triggeredFailures,
  type FailureEffect,
  type TriggeredFailure,
} from '@/lib/simulator/failure-lessons'
import type {
  BoardId,
  Circuit,
  ComponentCategory,
  ComponentId,
  SerialLine,
  SimulationFrame,
  WireEnd,
} from '@/types/simulator'
import { BoardCanvas } from '@/components/simulator/BoardCanvas'
import { ChallengePanel } from '@/components/simulator/ChallengePanel'
import { ComponentGuide } from '@/components/simulator/ComponentGuide'
import { ComponentThumb } from '@/components/simulator/ComponentArt'
import { MistakeExplainer } from '@/components/simulator/MistakeExplainer'
import { ValidationPanel } from '@/components/simulator/ValidationPanel'
import { SerialMonitor } from '@/components/simulator/SerialMonitor'
import { ReadingsPanel, type GaugedReading } from '@/components/simulator/ReadingsPanel'

const STORAGE_KEY = 'iot-at-christ:simulator:v1'
const DEFAULT_BOARD: BoardId = 'arduino-uno'
const MAX_SERIAL_LINES = 200
const TICK_MS = 800
const DRAMA_MS = 650 // pacing of the serial lines during a failure run

const CATEGORY_DOT: Record<ComponentCategory, string> = {
  sensor: 'bg-christ-green',
  actuator: 'bg-christ-saffron',
  passive: 'bg-christ-navy',
  input: 'bg-christ-gold',
}

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  sensor: 'Sensor',
  actuator: 'Actuator',
  passive: 'Passive',
  input: 'Input',
}

const EMPTY_EFFECTS: { byInstance: Record<string, FailureEffect>; byWire: Record<string, FailureEffect> } = {
  byInstance: {},
  byWire: {},
}

interface FailureRun {
  effects: typeof EMPTY_EFFECTS
  failures: TriggeredFailure[]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function sameEnd(a: WireEnd, b: WireEnd): boolean {
  if (a.kind === 'board' && b.kind === 'board') return a.pinId === b.pinId
  if (a.kind === 'component' && b.kind === 'component') {
    return a.instanceId === b.instanceId && a.terminalId === b.terminalId
  }
  return false
}

export function Workbench() {
  const [circuit, setCircuit] = useState<Circuit>({
    boardId: DEFAULT_BOARD,
    components: [],
    wires: [],
  })
  const [hydrated, setHydrated] = useState(false)
  const [pending, setPending] = useState<WireEnd | null>(null)
  const [runState, setRunState] = useState<'idle' | 'running' | 'failing'>('idle')
  const [serial, setSerial] = useState<SerialLine[]>([])
  const [frame, setFrame] = useState<SimulationFrame | null>(null)
  const [guideFor, setGuideFor] = useState<ComponentId | null>(null)
  const [failure, setFailure] = useState<FailureRun | null>(null)
  const [explainerOpen, setExplainerOpen] = useState(false)
  const tickRef = useRef(0)
  const circuitRef = useRef(circuit)
  circuitRef.current = circuit

  const board = getBoard(circuit.boardId)
  const validation = useMemo(() => validateCircuit(circuit), [circuit])
  const errorCount = validation.issues.filter((i) => i.severity === 'error').length
  const hasWiring = circuit.wires.length > 0

  // --- Persistence (guarded for SSR) -------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as Circuit
        if (saved && saved.boardId in BOARDS && Array.isArray(saved.components) && Array.isArray(saved.wires)) {
          setCircuit(saved)
        }
      }
    } catch {
      // Corrupted save — quietly start with a fresh bench.
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(circuit))
    } catch {
      // Storage full/blocked — the bench still works, it just won't persist.
    }
  }, [circuit, hydrated])

  // Any edit to the circuit clears the aftermath of the last failure run —
  // the student is fixing things, so the smoke clears.
  useEffect(() => {
    setFailure(null)
    setExplainerOpen(false)
  }, [circuit])

  // --- Healthy simulation loop --------------------------------------------
  useEffect(() => {
    if (runState !== 'running') return
    const id = window.setInterval(() => {
      tickRef.current += 1
      const next = simulateStep(circuitRef.current, tickRef.current)
      setFrame(next)
      if (next.serial.length > 0) {
        setSerial(prev => [...prev, ...next.serial].slice(-MAX_SERIAL_LINES))
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [runState])

  // --- Failure run: play out the drama, then explain ----------------------
  useEffect(() => {
    if (runState !== 'failing' || !failure) return
    const queue: string[] = [
      `Booting ${getBoard(circuitRef.current.boardId).name}...`,
      'Powering circuit...',
      ...failure.failures.flatMap((f) => f.lesson.serialDrama),
      '--- simulation halted ---',
    ]
    let i = 0
    const id = window.setInterval(() => {
      if (i >= queue.length) {
        window.clearInterval(id)
        setRunState('idle')
        setExplainerOpen(true)
        return
      }
      const text = queue[i]
      tickRef.current += 1
      const tick = tickRef.current
      setSerial(prev => [...prev, { tick, text }].slice(-MAX_SERIAL_LINES))
      i += 1
    }, DRAMA_MS)
    return () => window.clearInterval(id)
  }, [runState, failure])

  const startRun = () => {
    setPending(null)
    if (validation.ok) {
      setRunState('running')
      if (tickRef.current === 0) {
        setSerial(prev => [
          ...prev,
          { tick: 0, text: `Booting ${board.name}...` },
          { tick: 0, text: 'Setup complete. Reading sensors...' },
        ])
      }
      return
    }
    // The student runs a broken circuit on purpose (or hasn't noticed) —
    // let it fail visibly, then explain. That IS the lesson.
    setFailure({
      effects: failureEffectMap(validation.issues),
      failures: triggeredFailures(validation.issues),
    })
    setRunState('failing')
  }

  const stopRun = () => setRunState('idle')

  // --- Bench actions --------------------------------------------------------
  const switchBoard = (boardId: BoardId) => {
    if (boardId === circuit.boardId) return
    setRunState('idle')
    setPending(null)
    setFrame(null)
    // Pin layouts differ between boards, so old wires would point at pins
    // that no longer exist — keep the parts, drop the wiring.
    setCircuit(c => ({ boardId, components: c.components, wires: [] }))
  }

  const addComponent = (componentId: ComponentId) => {
    setCircuit(c => {
      const n = c.components.length
      // Stagger placements so freshly added parts never stack on each other.
      const placed = {
        instanceId: newId(),
        componentId,
        x: 320 + (n % 3) * 165,
        y: 40 + (Math.floor(n / 3) % 4) * 122,
      }
      return { ...c, components: [...c.components, placed] }
    })
  }

  const tapEndpoint = useCallback(
    (end: WireEnd) => {
      if (!pending) {
        setPending(end)
        return
      }
      if (sameEnd(pending, end)) {
        setPending(null) // tapping the same endpoint cancels
        return
      }
      // No wiring a component back into itself.
      if (pending.kind === 'component' && end.kind === 'component' && pending.instanceId === end.instanceId) {
        return
      }
      const wire = { id: newId(), from: pending, to: end }
      setCircuit(c => {
        const duplicate = c.wires.some(
          w =>
            (sameEnd(w.from, wire.from) && sameEnd(w.to, wire.to)) ||
            (sameEnd(w.from, wire.to) && sameEnd(w.to, wire.from)),
        )
        return duplicate ? c : { ...c, wires: [...c.wires, wire] }
      })
      setPending(null)
    },
    [pending],
  )

  const moveComponent = useCallback((instanceId: string, x: number, y: number) => {
    setCircuit(c => ({
      ...c,
      components: c.components.map(p => (p.instanceId === instanceId ? { ...p, x, y } : p)),
    }))
  }, [])

  const removeComponent = useCallback((instanceId: string) => {
    setPending(prev => (prev?.kind === 'component' && prev.instanceId === instanceId ? null : prev))
    setCircuit(c => ({
      ...c,
      components: c.components.filter(p => p.instanceId !== instanceId),
      wires: c.wires.filter(
        w =>
          !(w.from.kind === 'component' && w.from.instanceId === instanceId) &&
          !(w.to.kind === 'component' && w.to.instanceId === instanceId),
      ),
    }))
  }, [])

  const removeWire = useCallback((wireId: string) => {
    setCircuit(c => ({ ...c, wires: c.wires.filter(w => w.id !== wireId) }))
  }, [])

  const resetBench = () => {
    if (!window.confirm('Clear your whole bench? Every component and wire will be removed.')) return
    setRunState('idle')
    setPending(null)
    setFrame(null)
    setSerial([])
    tickRef.current = 0
    setCircuit(c => ({ boardId: c.boardId, components: [], wires: [] }))
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore — nothing to clean up if storage is unavailable
    }
  }

  // Enrich readings with their min/max range so the panel can draw gauges.
  const gaugedReadings: GaugedReading[] = useMemo(() => {
    const out: GaugedReading[] = []
    for (const r of frame?.readings ?? []) {
      const placed = circuit.components.find((c) => c.instanceId === r.instanceId)
      const def = placed ? getComponent(placed.componentId) : undefined
      const range = def?.readings?.find((d) => d.label === r.label)
      out.push({ ...r, min: range?.min ?? 0, max: range?.max ?? Math.max(1, r.value) })
    }
    return out
  }, [frame, circuit.components])

  const running = runState !== 'idle'
  const shorted = failure?.failures.some((f) => f.lesson.code === 'short-circuit') ?? false

  // --- Render ---------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Board switcher */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.values(BOARDS).map(b => (
            <button
              key={b.id}
              onClick={() => switchBoard(b.id)}
              className={cn(
                'rounded-lg border bg-white p-3 text-left transition-colors',
                b.id === circuit.boardId
                  ? 'border-christ-saffron ring-1 ring-christ-saffron'
                  : 'border-christ-navy/10 hover:border-christ-saffron/50',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: b.accentColor }} />
                  <span className="font-display font-semibold text-sm text-christ-navy">{b.name}</span>
                </span>
                <span className="font-mono text-[10px] text-christ-gold border border-christ-gold/30 rounded-full px-1.5 py-0.5 whitespace-nowrap">
                  {b.logicVoltage}V logic
                </span>
              </span>
              <span className="block text-xs font-body text-christ-navy/50 mt-1">{b.description}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] font-body text-christ-navy/40 mt-1.5">
          Switching boards keeps your components but clears the wires — every board has a different pin layout.
        </p>
      </section>

      {/* Parts bin */}
      <section>
        <h2 className="text-sm font-display font-semibold text-christ-navy mb-2">
          Parts bin — tap a part to add it, tap <Info className="inline h-3 w-3" /> to learn how it works
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {Object.values(COMPONENTS).map(def => (
            <div
              key={def.id}
              className="relative rounded-lg border border-christ-navy/10 bg-white hover:border-christ-saffron/60 hover:shadow-sm transition-all"
            >
              <button
                onClick={() => addComponent(def.id)}
                title={def.description}
                className="w-full flex flex-col items-center gap-1 px-1.5 pt-2 pb-1.5 active:scale-95 transition-transform"
              >
                <ComponentThumb componentId={def.id} size={52} />
                <span className="text-[11px] font-body text-christ-navy leading-tight text-center">{def.name}</span>
                <span className="flex items-center gap-1 text-[9px] font-mono text-christ-navy/40 uppercase tracking-wide">
                  <span className={cn('h-1.5 w-1.5 rounded-full', CATEGORY_DOT[def.category])} />
                  {CATEGORY_LABEL[def.category]}
                </span>
              </button>
              <button
                onClick={() => setGuideFor(def.id)}
                aria-label={`How the ${def.name} works`}
                className="absolute top-1 right-1 rounded-full p-1 text-christ-navy/40 hover:text-christ-saffron hover:bg-christ-saffron/10 transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Workbench split: canvas (left on md+) and panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <section className="md:col-span-2 space-y-3">
          {pending && (
            <div className="rounded-md border border-christ-saffron/40 bg-christ-saffron/10 px-3 py-2 text-xs font-body text-christ-saffron">
              Now tap where this wire should go — the <span className="text-christ-green font-semibold">green pulsing rings</span> mark
              electrically sensible targets. (Tap the same point again to cancel.)
            </div>
          )}

          <BoardCanvas
            board={board}
            circuit={circuit}
            pending={pending}
            issues={validation.issues}
            actuatorStates={runState === 'running' ? (frame?.actuatorStates ?? {}) : {}}
            running={running}
            failureEffects={failure?.effects ?? EMPTY_EFFECTS}
            shorted={shorted}
            onTapEndpoint={tapEndpoint}
            onMoveComponent={moveComponent}
            onRemoveComponent={removeComponent}
            onRemoveWire={removeWire}
            onShowGuide={setGuideFor}
          />

          {/* Run controls + bench status */}
          <div className="flex flex-wrap items-center gap-2">
            {running ? (
              <button
                onClick={stopRun}
                className="inline-flex items-center gap-1.5 rounded-md bg-christ-red px-4 py-2 text-sm font-body text-white hover:bg-christ-red/90 transition-colors"
              >
                <Square className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button
                onClick={startRun}
                disabled={!hasWiring}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-body text-white transition-colors',
                  !hasWiring
                    ? 'bg-christ-navy/30 cursor-not-allowed'
                    : validation.ok
                      ? 'bg-christ-green hover:bg-christ-green/90'
                      : 'bg-christ-saffron hover:bg-christ-saffron/90',
                )}
              >
                {validation.ok ? (
                  <>
                    <Play className="h-4 w-4" /> Run Simulation
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4" /> Run Anyway — watch it fail
                  </>
                )}
              </button>
            )}
            <button
              onClick={resetBench}
              className="inline-flex items-center gap-1.5 rounded-md border border-christ-navy/20 bg-white px-4 py-2 text-sm font-body text-christ-navy/70 hover:border-christ-red/50 hover:text-christ-red transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Reset Bench
            </button>

            {/* Status chip */}
            {hasWiring && (
              validation.ok ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-christ-green/10 px-2.5 py-1 text-[11px] font-body text-christ-green">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Bench OK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-christ-red/10 px-2.5 py-1 text-[11px] font-body text-christ-red">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errorCount} problem{errorCount === 1 ? '' : 's'} — run it and see what breaks
                </span>
              )
            )}
            {failure && !explainerOpen && failure.failures.length > 0 && (
              <button
                onClick={() => setExplainerOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-christ-red/30 bg-white px-2.5 py-1 text-[11px] font-body text-christ-red hover:bg-christ-red/5 transition-colors"
              >
                <Flame className="h-3.5 w-3.5" /> What just went wrong?
              </button>
            )}
          </div>

          {/* Teaching notes for the selected board */}
          <div className="rounded-lg border border-christ-navy/10 bg-white p-3">
            <h3 className="text-xs font-display font-semibold text-christ-navy mb-1.5">
              Good to know about the {board.name}
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              {board.teachingNotes.map((note, i) => (
                <li key={i} className="text-xs font-body text-christ-navy/60">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Side panels — stack below the canvas on mobile */}
        <section className="space-y-4">
          <ChallengePanel circuit={circuit} validation={validation} />
          <ValidationPanel result={validation} wireCount={circuit.wires.length} />
          <ReadingsPanel readings={gaugedReadings} running={runState === 'running'} />
          <SerialMonitor lines={serial} boardName={board.name} onClear={() => setSerial([])} />
        </section>
      </div>

      <ComponentGuide componentId={guideFor} onClose={() => setGuideFor(null)} />
      <MistakeExplainer
        failures={failure?.failures ?? []}
        open={explainerOpen}
        onClose={() => setExplainerOpen(false)}
      />
    </div>
  )
}
