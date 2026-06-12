'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, RotateCcw, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BOARDS, getBoard } from '@/lib/simulator/boards'
import { COMPONENTS } from '@/lib/simulator/components'
import { validateCircuit } from '@/lib/simulator/validation'
import { simulateStep } from '@/lib/simulator/simulation'
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
import { ValidationPanel } from '@/components/simulator/ValidationPanel'
import { SerialMonitor } from '@/components/simulator/SerialMonitor'
import { ReadingsPanel } from '@/components/simulator/ReadingsPanel'

const STORAGE_KEY = 'iot-at-christ:simulator:v1'
const DEFAULT_BOARD: BoardId = 'arduino-uno'
const MAX_SERIAL_LINES = 200
const TICK_MS = 800

// Palette chip accents per component category (Christ brand tokens)
const CATEGORY_CHIP: Record<ComponentCategory, string> = {
  sensor: 'border-christ-green/40 text-christ-green bg-christ-green/5',
  actuator: 'border-christ-saffron/40 text-christ-saffron bg-christ-saffron/5',
  passive: 'border-christ-navy/30 text-christ-navy bg-christ-navy/5',
  input: 'border-christ-gold/40 text-christ-gold bg-christ-gold/5',
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
  const [running, setRunning] = useState(false)
  const [serial, setSerial] = useState<SerialLine[]>([])
  const [frame, setFrame] = useState<SimulationFrame | null>(null)
  const tickRef = useRef(0)
  const circuitRef = useRef(circuit)
  circuitRef.current = circuit

  const board = getBoard(circuit.boardId)
  const validation = useMemo(() => validateCircuit(circuit), [circuit])

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

  // --- Simulation loop -----------------------------------------------------
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      tickRef.current += 1
      const next = simulateStep(circuitRef.current, tickRef.current)
      setFrame(next)
      if (next.serial.length > 0) {
        setSerial(prev => [...prev, ...next.serial].slice(-MAX_SERIAL_LINES))
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [running])

  // --- Actions ---------------------------------------------------------------
  const switchBoard = (boardId: BoardId) => {
    if (boardId === circuit.boardId) return
    setRunning(false)
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
        x: 300 + (n % 3) * 155,
        y: 60 + (Math.floor(n / 3) % 4) * 112,
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
    setRunning(false)
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
                <span className="font-display font-semibold text-sm text-christ-navy">{b.name}</span>
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

      {/* Component palette */}
      <section>
        <h2 className="text-sm font-display font-semibold text-christ-navy mb-2">Parts bin — tap to add</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Object.values(COMPONENTS).map(def => (
            <button
              key={def.id}
              onClick={() => addComponent(def.id)}
              title={def.description}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-body transition-transform active:scale-95',
                CATEGORY_CHIP[def.category],
              )}
            >
              <span aria-hidden>{def.glyph}</span>
              <span>{def.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Workbench split: canvas (left on md+) and panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <section className="md:col-span-2 space-y-3">
          {pending && (
            <div className="rounded-md border border-christ-saffron/40 bg-christ-saffron/10 px-3 py-2 text-xs font-body text-christ-saffron">
              Now tap where this wire should go… (tap again to cancel)
            </div>
          )}

          <BoardCanvas
            board={board}
            circuit={circuit}
            pending={pending}
            issues={validation.issues}
            actuatorStates={running ? (frame?.actuatorStates ?? {}) : {}}
            onTapEndpoint={tapEndpoint}
            onMoveComponent={moveComponent}
            onRemoveComponent={removeComponent}
            onRemoveWire={removeWire}
          />

          {/* Run controls */}
          <div className="flex flex-wrap items-center gap-2">
            {running ? (
              <button
                onClick={() => setRunning(false)}
                className="inline-flex items-center gap-1.5 rounded-md bg-christ-red px-4 py-2 text-sm font-body text-white hover:bg-christ-red/90 transition-colors"
              >
                <Square className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button
                onClick={() => setRunning(true)}
                disabled={!validation.ok}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-body text-white transition-colors',
                  validation.ok
                    ? 'bg-christ-green hover:bg-christ-green/90'
                    : 'bg-christ-navy/30 cursor-not-allowed',
                )}
              >
                <Play className="h-4 w-4" /> Run Simulation
              </button>
            )}
            <button
              onClick={resetBench}
              className="inline-flex items-center gap-1.5 rounded-md border border-christ-navy/20 bg-white px-4 py-2 text-sm font-body text-christ-navy/70 hover:border-christ-red/50 hover:text-christ-red transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Reset Bench
            </button>
            {!validation.ok && !running && (
              <span className="text-[11px] font-body text-christ-navy/50">
                Fix the red issues in “Test Connections” first, then you can run.
              </span>
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
          <ReadingsPanel readings={frame?.readings ?? []} running={running} />
          <SerialMonitor lines={serial} boardName={board.name} />
        </section>
      </div>
    </div>
  )
}
