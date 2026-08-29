'use client'

import { useRef, useState } from 'react'
import { getComponent } from '@/lib/simulator/components'
import type { FailureEffect } from '@/lib/simulator/failure-lessons'
import type {
  BoardDef,
  Circuit,
  ComponentId,
  PinCapability,
  PinDef,
  PlacedComponent,
  TerminalRole,
  ValidationIssue,
  WireEnd,
} from '@/types/simulator'
import {
  BoardArt,
  BOARD_H,
  BOARD_Y,
  PIN_LEFT_X,
  PIN_RIGHT_X,
  VIEW_H,
  VIEW_W,
} from '@/components/simulator/BoardArt'
import { ART_H, ART_W, ComponentArt } from '@/components/simulator/ComponentArt'

interface FailureEffects {
  byInstance: Record<string, FailureEffect>
  byWire: Record<string, FailureEffect>
}

interface BoardCanvasProps {
  board: BoardDef
  circuit: Circuit
  pending: WireEnd | null
  issues: ValidationIssue[]
  actuatorStates: Record<string, boolean | number>
  /** Simulation is running (healthy or failing) — lights the power LED */
  running: boolean
  /** Effects from a failure run; empty maps when the circuit is healthy */
  failureEffects: FailureEffects
  /** A short circuit collapsed the supply — power LED dies */
  shorted: boolean
  onTapEndpoint: (end: WireEnd) => void
  onMoveComponent: (instanceId: string, x: number, y: number) => void
  onRemoveComponent: (instanceId: string) => void
  onRemoveWire: (wireId: string) => void
  onShowGuide: (componentId: ComponentId) => void
}

// --- Pin helpers -----------------------------------------------------------

function pinColor(pin: PinDef): string {
  if (pin.capabilities.includes('power-5v')) return '#C0392B'
  if (pin.capabilities.includes('power-3v3')) return '#E8720C'
  if (pin.capabilities.includes('ground')) return '#263238'
  if (pin.capabilities.includes('analog-in')) return '#7C3AED'
  return '#1565C0'
}

/**
 * Silkscreen label drawn on the board. Long parentheticals like
 * "GPIO14 (TXD)" or "5V (pin 2)" collide with the chip art, so the detail
 * lives in the tooltip and the silk shows just the pin name.
 */
function silkLabel(pin: PinDef): string {
  const short = pin.label.replace(/\s*\(.*\)\s*$/, '')
  return pin.capabilities.includes('pwm') ? `${short}~` : short
}

function pinTooltip(pin: PinDef): string {
  const parts: string[] = []
  if (pin.capabilities.includes('power-5v')) parts.push('5V power rail')
  if (pin.capabilities.includes('power-3v3')) parts.push('3.3V power rail')
  if (pin.capabilities.includes('ground')) parts.push('Ground (GND)')
  if (pin.capabilities.includes('gpio')) parts.push('bidirectional digital GPIO')
  if (pin.capabilities.includes('digital-input')) parts.push('digital input only')
  if (pin.capabilities.includes('digital-output')) parts.push('digital output only')
  if (pin.capabilities.includes('pwm')) parts.push('PWM-capable (~)')
  if (pin.capabilities.includes('analog-in')) parts.push('analog input (ADC)')
  if (pin.capabilities.includes('i2c-sda')) parts.push('I2C SDA')
  if (pin.capabilities.includes('i2c-scl')) parts.push('I2C SCL')
  if (pin.capabilities.includes('uart-tx')) parts.push('UART TX')
  if (pin.capabilities.includes('uart-rx')) parts.push('UART RX')
  const warning = pin.warnings?.length ? ` — Caution: ${pin.warnings.join(' ')}` : ''
  return `${pin.label} — ${parts.join(', ')}${warning}`
}

function pinPosition(board: BoardDef, pin: PinDef): { x: number; y: number } {
  const sidePins = board.pins.filter((p) => p.side === pin.side)
  const count = Math.max(...sidePins.map((p) => p.index)) + 1
  const spacing = (BOARD_H - 24) / count
  return {
    x: pin.side === 'left' ? PIN_LEFT_X : PIN_RIGHT_X,
    y: BOARD_Y + 12 + spacing / 2 + pin.index * spacing,
  }
}

function terminalPositions(placed: PlacedComponent): Array<{ id: string; label: string; role: TerminalRole; x: number; y: number }> {
  const def = getComponent(placed.componentId)
  const n = def.terminals.length
  return def.terminals.map((t, i) => ({
    id: t.id,
    label: t.label,
    role: t.role,
    x: placed.x + ((i + 1) * ART_W) / (n + 1),
    y: placed.y + ART_H + 12,
  }))
}

function endPosition(end: WireEnd, board: BoardDef, circuit: Circuit): { x: number; y: number } | null {
  if (end.kind === 'board') {
    const pin = board.pins.find((p) => p.id === end.pinId)
    return pin ? pinPosition(board, pin) : null
  }
  const placed = circuit.components.find((c) => c.instanceId === end.instanceId)
  if (!placed) return null
  const term = terminalPositions(placed).find((t) => t.id === end.terminalId)
  return term ? { x: term.x, y: term.y } : null
}

function sameEnd(a: WireEnd, b: WireEnd): boolean {
  if (a.kind === 'board' && b.kind === 'board') return a.pinId === b.pinId
  if (a.kind === 'component' && b.kind === 'component') {
    return a.instanceId === b.instanceId && a.terminalId === b.terminalId
  }
  return false
}

// --- Wiring compatibility (drives the green "good target" pulses) ----------

const ROLE_TO_CAPS: Record<TerminalRole, PinCapability[]> = {
  vcc: ['power-5v', 'power-3v3'],
  gnd: ['ground'],
  'analog-out': ['analog-in'],
  'digital-out': ['gpio', 'digital-input'],
  'digital-in': ['gpio', 'digital-output', 'pwm'],
  passive: [], // a resistor leg may legally go anywhere
}

function roleMatchesPin(role: TerminalRole, pin: PinDef): boolean {
  if (role === 'passive') return true
  return ROLE_TO_CAPS[role].some((cap) => pin.capabilities.includes(cap))
}

function pendingRole(pending: WireEnd, circuit: Circuit): TerminalRole | null {
  if (pending.kind !== 'component') return null
  const placed = circuit.components.find((c) => c.instanceId === pending.instanceId)
  if (!placed) return null
  const term = getComponent(placed.componentId).terminals.find((t) => t.id === pending.terminalId)
  return term?.role ?? null
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = svg.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  }
}

// --- Failure overlays --------------------------------------------------------

function SmokeOverlay({ x, y }: { x: number; y: number }) {
  return (
    <g pointerEvents="none">
      <circle cx={x - 6} cy={y} r={5} fill="#90A4AE" className="sim-smoke" />
      <circle cx={x + 4} cy={y + 2} r={6.5} fill="#B0BEC5" className="sim-smoke-2" />
      <circle cx={x} cy={y - 3} r={4} fill="#78909C" className="sim-smoke-3" />
    </g>
  )
}

function SparkOverlay({ x, y }: { x: number; y: number }) {
  const star = 'M 0 -11 L 3 -3 L 11 0 L 3 3 L 0 11 L -3 3 L -11 0 L -3 -3 Z'
  return (
    <g pointerEvents="none" transform={`translate(${x} ${y})`}>
      <path d={star} fill="#FFD54F" stroke="#E8720C" strokeWidth={1.5} className="sim-spark" />
      <circle r={3.5} fill="#FFF8E1" className="sim-spark" />
    </g>
  )
}

// ---------------------------------------------------------------------------

export function BoardCanvas({
  board,
  circuit,
  pending,
  issues,
  actuatorStates,
  running,
  failureEffects,
  shorted,
  onTapEndpoint,
  onMoveComponent,
  onRemoveComponent,
  onRemoveWire,
  onShowGuide,
}: BoardCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ instanceId: string; startSvg: { x: number; y: number }; startPos: { x: number; y: number } } | null>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const [hoveredWire, setHoveredWire] = useState<string | null>(null)

  const highlightedPins = new Set(issues.map((i) => i.pinId).filter((id): id is string => !!id))
  const highlightedInstances = new Set(
    issues.filter((i) => i.severity === 'error').map((i) => i.instanceId).filter((id): id is string => !!id),
  )
  const highlightedWires = new Set(issues.map((i) => i.wireId).filter((id): id is string => !!id))

  const isPending = (end: WireEnd): boolean => (pending ? sameEnd(pending, end) : false)
  const pendRole = pending ? pendingRole(pending, circuit) : null
  const pendingIsBoardPin = pending?.kind === 'board'
  const pendingPin = pendingIsBoardPin ? board.pins.find((p) => p.id === pending.pinId) : undefined

  /** Should this board pin pulse green as a legal target for the pending wire? */
  const pinIsGoodTarget = (pin: PinDef): boolean => {
    if (!pending || pendingIsBoardPin) return false
    return pendRole !== null && roleMatchesPin(pendRole, pin)
  }

  /** Should this component terminal pulse green as a legal target? */
  const terminalIsGoodTarget = (role: TerminalRole, end: WireEnd): boolean => {
    if (!pending || sameEnd(pending, end)) return false
    if (pendingIsBoardPin) return pendingPin !== undefined && roleMatchesPin(role, pendingPin)
    // terminal → terminal: a passive leg (the resistor) bridges anything
    return role === 'passive' || pendRole === 'passive'
  }

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, placed: PlacedComponent) => {
    const svg = svgRef.current
    if (!svg) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = {
      instanceId: placed.instanceId,
      startSvg: toSvgPoint(svg, e.clientX, e.clientY),
      startPos: { x: placed.x, y: placed.y },
    }
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const p = toSvgPoint(svg, e.clientX, e.clientY)
    if (pending) setCursor(p)
    const drag = dragRef.current
    if (!drag) return
    const dx = p.x - drag.startSvg.x
    const dy = p.y - drag.startSvg.y
    // Keep parts on the bench and off the board silkscreen.
    const nx = Math.min(VIEW_W - ART_W - 4, Math.max(280, drag.startPos.x + dx))
    const ny = Math.min(VIEW_H - ART_H - 26, Math.max(4, drag.startPos.y + dy))
    onMoveComponent(drag.instanceId, nx, ny)
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const wireColor = (wire: Circuit['wires'][number]): string => {
    for (const end of [wire.from, wire.to]) {
      if (end.kind !== 'board') continue
      const pin = board.pins.find((p) => p.id === end.pinId)
      if (!pin) continue
      if (pin.capabilities.includes('power-5v')) return '#C0392B'
      if (pin.capabilities.includes('power-3v3')) return '#E8720C'
      if (pin.capabilities.includes('ground')) return '#263238'
      if (pin.capabilities.includes('analog-in')) return '#7C3AED'
    }
    return '#1565C0'
  }

  const pendingPos = pending ? endPosition(pending, board, circuit) : null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto rounded-xl border border-christ-navy/10 shadow-sm"
      style={{ touchAction: 'none', background: 'linear-gradient(180deg, #FDFDFB 0%, #F4F1EA 100%)' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setCursor(null)}
      role="application"
      aria-label={`Workbench with ${board.name}`}
    >
      {/* Bench grid */}
      <defs>
        <pattern id="bench-grid" width={24} height={24} patternUnits="userSpaceOnUse">
          <circle cx={12} cy={12} r={1} fill="#1B2E4B" opacity={0.08} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill="url(#bench-grid)" />

      {/* The dev board */}
      <BoardArt board={board} running={running} shorted={shorted} />

      {/* Wires (under pins/components so endpoints stay tappable) */}
      {circuit.wires.map((wire) => {
        const a = endPosition(wire.from, board, circuit)
        const b = endPosition(wire.to, board, circuit)
        if (!a || !b) return null
        const dx = Math.max(36, Math.abs(b.x - a.x) / 2)
        const path = `M ${a.x} ${a.y} C ${a.x + (b.x >= a.x ? dx : -dx)} ${a.y}, ${b.x - (b.x >= a.x ? dx : -dx)} ${b.y}, ${b.x} ${b.y}`
        const broken = highlightedWires.has(wire.id)
        const color = broken ? '#C0392B' : wireColor(wire)
        const hovered = hoveredWire === wire.id
        const wireEffect = failureEffects.byWire[wire.id]
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 8 }
        return (
          <g
            key={wire.id}
            className="cursor-pointer"
            onClick={() => onRemoveWire(wire.id)}
            onPointerEnter={() => setHoveredWire(wire.id)}
            onPointerLeave={() => setHoveredWire((w) => (w === wire.id ? null : w))}
          >
            <title>Tap to remove this wire</title>
            <path d={path} fill="none" stroke="transparent" strokeWidth={16} />
            {/* subtle insulation shadow gives the wire body */}
            <path d={path} fill="none" stroke="#00000022" strokeWidth={hovered ? 6.5 : 5} strokeLinecap="round" transform="translate(0 1.2)" />
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={hovered ? 5 : 3.5}
              strokeLinecap="round"
              className={broken ? 'sim-flicker' : undefined}
            />
            {hovered && (
              <g pointerEvents="none">
                <circle cx={mid.x} cy={mid.y} r={9} fill="#C0392B" />
                <text x={mid.x} y={mid.y + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="white">×</text>
              </g>
            )}
            {wireEffect === 'spark' && <SparkOverlay x={mid.x} y={mid.y + 8} />}
          </g>
        )
      })}

      {/* Rubber-band wire following the cursor */}
      {pending && pendingPos && cursor && (
        <path
          d={`M ${pendingPos.x} ${pendingPos.y} C ${(pendingPos.x + cursor.x) / 2} ${pendingPos.y}, ${(pendingPos.x + cursor.x) / 2} ${cursor.y}, ${cursor.x} ${cursor.y}`}
          fill="none"
          stroke="#E8720C"
          strokeWidth={2.5}
          strokeDasharray="6 5"
          strokeLinecap="round"
          pointerEvents="none"
          opacity={0.8}
        />
      )}
      {pending && pendingPos && (
        <circle cx={pendingPos.x} cy={pendingPos.y} r={10} fill="none" stroke="#E8720C" strokeWidth={2.5} className="animate-ping" pointerEvents="none" />
      )}

      {/* Board pins */}
      {board.pins.map((pin) => {
        const pos = pinPosition(board, pin)
        const end: WireEnd = { kind: 'board', pinId: pin.id }
        const flagged = highlightedPins.has(pin.id)
        const goodTarget = pinIsGoodTarget(pin)
        const dimmed = pending !== null && !pendingIsBoardPin && !goodTarget && !isPending(end)
        const isPwm = pin.capabilities.includes('pwm')
        return (
          <g key={pin.id} className="cursor-pointer" onClick={() => onTapEndpoint(end)} opacity={dimmed ? 0.35 : 1}>
            <title>{pinTooltip(pin)}</title>
            {goodTarget && <circle cx={pos.x} cy={pos.y} r={10} fill="none" stroke="#1A7A4A" strokeWidth={2.5} className="sim-target" />}
            {/* gold header pad with a colored role ring */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isPending(end) ? 8 : 6.5}
              fill={flagged ? '#C0392B' : '#D4AF37'}
              stroke={isPending(end) ? '#E8720C' : pinColor(pin)}
              strokeWidth={isPending(end) ? 3 : 2.2}
            />
            <circle cx={pos.x} cy={pos.y} r={2.2} fill="#3A2F0B" />
            <text
              x={pin.side === 'left' ? pos.x + 14 : pos.x - 14}
              y={pos.y}
              textAnchor={pin.side === 'left' ? 'start' : 'end'}
              dominantBaseline="middle"
              fontSize={8.5}
              className="font-mono"
              fill="white"
              opacity={0.92}
              pointerEvents="none"
            >
              {isPwm ? `${pin.label}~` : pin.label}
            </text>
          </g>
        )
      })}

      {/* Placed components */}
      {circuit.components.map((placed) => {
        const def = getComponent(placed.componentId)
        const terms = terminalPositions(placed)
        const state = actuatorStates[placed.instanceId]
        const broken = highlightedInstances.has(placed.instanceId)
        const effect = failureEffects.byInstance[placed.instanceId]
        const burned = effect === 'burnout' || effect === 'smoke'
        const cx = placed.x + ART_W / 2
        const artClass =
          effect === 'flicker' ? 'sim-flicker' : effect === 'glitch' ? 'sim-glitch' : undefined
        return (
          <g key={placed.instanceId}>
            <g
              onPointerDown={(e) => handlePointerDown(e, placed)}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* soft backing card — the drag handle */}
              <rect
                x={placed.x}
                y={placed.y}
                width={ART_W}
                height={ART_H}
                rx={10}
                fill="white"
                fillOpacity={0.55}
                stroke={broken ? '#C0392B' : '#1B2E4B22'}
                strokeWidth={broken ? 2 : 1.2}
                strokeDasharray={broken ? '5 3' : undefined}
              />
              <text x={cx} y={placed.y - 5} textAnchor="middle" fontSize={9.5} className="font-body" fill="#1B2E4B" opacity={0.75} pointerEvents="none">
                {def.name}
              </text>
              <g className={artClass} opacity={effect === 'dead' ? 0.45 : 1}>
                <g transform={`translate(${placed.x} ${placed.y})`}>
                  <ComponentArt componentId={placed.componentId} active={state} burned={burned} />
                </g>
              </g>
              {/* failure decorations */}
              {(effect === 'smoke' || effect === 'burnout') && <SmokeOverlay x={cx} y={placed.y + 8} />}
              {effect === 'spark' && <SparkOverlay x={cx} y={placed.y + 16} />}
              {effect === 'dead' && (
                <text x={placed.x + ART_W - 12} y={placed.y + 16} textAnchor="middle" fontSize={11} fill="#78909C" pointerEvents="none">
                  z z
                </text>
              )}
              {effect === 'glitch' && (
                <text x={cx} y={placed.y + 12} textAnchor="middle" fontSize={8} className="font-mono sim-flicker" fill="#C0392B" pointerEvents="none">
                  0x?? 0x??
                </text>
              )}
            </g>

            {/* Remove component */}
            <g className="cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemoveComponent(placed.instanceId)}>
              <title>Remove {def.name}</title>
              <circle cx={placed.x + ART_W - 4} cy={placed.y + 2} r={8} fill="white" stroke="#C0392B" strokeWidth={1.2} />
              <text x={placed.x + ART_W - 4} y={placed.y + 2.5} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#C0392B">×</text>
            </g>

            {/* How-it-works guide */}
            <g className="cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={() => onShowGuide(placed.componentId)}>
              <title>How the {def.name} works</title>
              <circle cx={placed.x + 4} cy={placed.y + 2} r={8} fill="white" stroke="#1565C0" strokeWidth={1.2} />
              <text x={placed.x + 4} y={placed.y + 3} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fill="#1565C0" fontStyle="italic" className="font-display">i</text>
            </g>

            {/* Terminals */}
            {terms.map((t) => {
              const end: WireEnd = { kind: 'component', instanceId: placed.instanceId, terminalId: t.id }
              const good = terminalIsGoodTarget(t.role, end)
              const dimmedT = pending !== null && !good && !isPending(end)
              return (
                <g
                  key={t.id}
                  className="cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onTapEndpoint(end)}
                  opacity={dimmedT ? 0.4 : 1}
                >
                  <title>{`${def.name} — ${t.label}`}</title>
                  {good && <circle cx={t.x} cy={t.y} r={9} fill="none" stroke="#1A7A4A" strokeWidth={2.5} className="sim-target" />}
                  <circle
                    cx={t.x}
                    cy={t.y}
                    r={isPending(end) ? 7 : 5.5}
                    fill={isPending(end) ? '#E8720C' : '#C9CED4'}
                    stroke={isPending(end) ? '#B85500' : '#5B6770'}
                    strokeWidth={1.6}
                  />
                  <text x={t.x} y={t.y + 15} textAnchor="middle" fontSize={8} className="font-mono" fill="#1B2E4B" opacity={0.7} pointerEvents="none">
                    {t.label}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
