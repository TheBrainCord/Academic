'use client'

import { useRef } from 'react'
import { getComponent } from '@/lib/simulator/components'
import type {
  BoardDef,
  Circuit,
  ComponentId,
  PinDef,
  PlacedComponent,
  ValidationIssue,
  WireEnd,
} from '@/types/simulator'

const VIEW_W = 800
const VIEW_H = 520
const BOARD_X = 60
const BOARD_Y = 20
const BOARD_W = 170
const BOARD_H = 480
const LEFT_PIN_X = BOARD_X - 24
const RIGHT_PIN_X = BOARD_X + BOARD_W + 24
const CARD_W = 120
const CARD_H = 76

interface BoardCanvasProps {
  board: BoardDef
  circuit: Circuit
  pending: WireEnd | null
  issues: ValidationIssue[]
  actuatorStates: Record<string, boolean | number>
  onTapEndpoint: (end: WireEnd) => void
  onMoveComponent: (instanceId: string, x: number, y: number) => void
  onRemoveComponent: (instanceId: string) => void
  onRemoveWire: (wireId: string) => void
  onShowGuide: (componentId: ComponentId) => void
}

function pinColor(pin: PinDef): string {
  if (pin.capabilities.includes('power-5v')) return '#C0392B'
  if (pin.capabilities.includes('power-3v3')) return '#E8720C'
  if (pin.capabilities.includes('ground')) return '#1B2E4B'
  if (pin.capabilities.includes('analog-in')) return '#7C3AED'
  return '#1565C0'
}

function pinLabel(pin: PinDef): string {
  return pin.capabilities.includes('pwm') ? `${pin.label}~` : pin.label
}

function pinPosition(board: BoardDef, pin: PinDef): { x: number; y: number } {
  const sidePins = board.pins.filter((p) => p.side === pin.side)
  const count = Math.max(...sidePins.map((p) => p.index)) + 1
  const spacing = BOARD_H / count
  return {
    x: pin.side === 'left' ? LEFT_PIN_X : RIGHT_PIN_X,
    y: BOARD_Y + spacing / 2 + pin.index * spacing,
  }
}

function terminalPositions(placed: PlacedComponent): Array<{ id: string; label: string; x: number; y: number }> {
  const def = getComponent(placed.componentId)
  const n = def.terminals.length
  return def.terminals.map((t, i) => ({
    id: t.id,
    label: t.label,
    x: placed.x + ((i + 1) * CARD_W) / (n + 1),
    y: placed.y + CARD_H + 10,
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

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = svg.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  }
}

export function BoardCanvas({
  board,
  circuit,
  pending,
  issues,
  actuatorStates,
  onTapEndpoint,
  onMoveComponent,
  onRemoveComponent,
  onRemoveWire,
  onShowGuide,
}: BoardCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ instanceId: string; startSvg: { x: number; y: number }; startPos: { x: number; y: number } } | null>(null)

  const highlightedPins = new Set(issues.map((i) => i.pinId).filter((id): id is string => !!id))
  const highlightedInstances = new Set(issues.map((i) => i.instanceId).filter((id): id is string => !!id))
  const highlightedWires = new Set(issues.map((i) => i.wireId).filter((id): id is string => !!id))

  const isPending = (end: WireEnd): boolean => (pending ? sameEnd(pending, end) : false)

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

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    const drag = dragRef.current
    const svg = svgRef.current
    if (!drag || !svg) return
    const p = toSvgPoint(svg, e.clientX, e.clientY)
    const dx = p.x - drag.startSvg.x
    const dy = p.y - drag.startSvg.y
    onMoveComponent(drag.instanceId, drag.startPos.x + dx, drag.startPos.y + dy)
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const wireColor = (wire: Circuit['wires'][number]): string => {
    for (const end of [wire.from, wire.to]) {
      if (end.kind !== 'board') continue
      const pin = board.pins.find((p) => p.id === end.pinId)
      if (!pin) continue
      if (pin.capabilities.includes('power-5v') || pin.capabilities.includes('power-3v3')) return '#C0392B'
      if (pin.capabilities.includes('ground')) return '#1B2E4B'
    }
    return '#E8720C'
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-auto rounded-lg border border-christ-navy/10 bg-white"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Board */}
      <rect
        x={BOARD_X}
        y={BOARD_Y}
        width={BOARD_W}
        height={BOARD_H}
        rx={10}
        fill={board.accentColor}
        fillOpacity={0.12}
        stroke={board.accentColor}
        strokeWidth={2}
      />
      <text
        x={BOARD_X + BOARD_W / 2}
        y={BOARD_Y + BOARD_H / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-display font-bold"
        fill={board.accentColor}
        fontSize={14}
        transform={`rotate(-90 ${BOARD_X + BOARD_W / 2} ${BOARD_Y + BOARD_H / 2})`}
      >
        {board.name}
      </text>

      {/* Wires (rendered first so pins/components sit on top) */}
      {circuit.wires.map((wire) => {
        const a = endPosition(wire.from, board, circuit)
        const b = endPosition(wire.to, board, circuit)
        if (!a || !b) return null
        const dx = (b.x - a.x) / 2
        const path = `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`
        const color = highlightedWires.has(wire.id) ? '#C0392B' : wireColor(wire)
        return (
          <g key={wire.id} className="cursor-pointer" onClick={() => onRemoveWire(wire.id)}>
            <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
            <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          </g>
        )
      })}

      {/* Pending wire pulse */}
      {pending &&
        (() => {
          const p = endPosition(pending, board, circuit)
          if (!p) return null
          return <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="#E8720C" strokeWidth={2} className="animate-ping" />
        })()}

      {/* Board pins */}
      {board.pins.map((pin) => {
        const pos = pinPosition(board, pin)
        const end: WireEnd = { kind: 'board', pinId: pin.id }
        const highlighted = highlightedPins.has(pin.id)
        return (
          <g key={pin.id} className="cursor-pointer" onClick={() => onTapEndpoint(end)}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={isPending(end) ? 8 : 6}
              fill={highlighted ? '#C0392B' : pinColor(pin)}
              stroke={isPending(end) ? '#E8720C' : 'white'}
              strokeWidth={isPending(end) ? 2.5 : 1}
            />
            <text
              x={pin.side === 'left' ? pos.x - 10 : pos.x + 10}
              y={pos.y}
              textAnchor={pin.side === 'left' ? 'end' : 'start'}
              dominantBaseline="middle"
              fontSize={9}
              className="font-mono"
              fill="#1B2E4B"
            >
              {pinLabel(pin)}
            </text>
          </g>
        )
      })}

      {/* Placed components */}
      {circuit.components.map((placed) => {
        const def = getComponent(placed.componentId)
        const terms = terminalPositions(placed)
        const state = actuatorStates[placed.instanceId]
        const highlighted = highlightedInstances.has(placed.instanceId)
        return (
          <g key={placed.instanceId}>
            <g
              onPointerDown={(e) => handlePointerDown(e, placed)}
              className="cursor-grab active:cursor-grabbing"
            >
              <rect
                x={placed.x}
                y={placed.y}
                width={CARD_W}
                height={CARD_H}
                rx={8}
                fill="white"
                stroke={highlighted ? '#C0392B' : '#1B2E4B33'}
                strokeWidth={highlighted ? 2 : 1.5}
              />
              <text x={placed.x + CARD_W / 2} y={placed.y + 22} textAnchor="middle" fontSize={12} className="font-mono font-bold" fill="#1B2E4B">
                {def.glyph}
              </text>
              <text x={placed.x + CARD_W / 2} y={placed.y + 40} textAnchor="middle" fontSize={9} className="font-body" fill="#1B2E4B99">
                {def.name}
              </text>
              {/* Actuator visual feedback */}
              {def.id === 'led' && state ? (
                <circle
                  cx={placed.x + CARD_W / 2}
                  cy={placed.y - 8}
                  r={8}
                  fill="#F5A623"
                  fillOpacity={typeof state === 'number' ? state : 1}
                />
              ) : null}
              {def.id === 'buzzer' && state ? (
                <text x={placed.x + CARD_W / 2} y={placed.y - 6} textAnchor="middle" fontSize={12} fill="#E8720C">
                  )))
                </text>
              ) : null}
            </g>

            {/* Remove component */}
            <g className="cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={() => onRemoveComponent(placed.instanceId)}>
              <circle cx={placed.x + CARD_W - 6} cy={placed.y + 6} r={7} fill="#C0392B" />
              <text x={placed.x + CARD_W - 6} y={placed.y + 6} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="white">
                ×
              </text>
            </g>

            {/* How-it-works guide */}
            <g className="cursor-pointer" onPointerDown={(e) => e.stopPropagation()} onClick={() => onShowGuide(placed.componentId)}>
              <circle cx={placed.x + 6} cy={placed.y + 6} r={7} fill="#1565C0" />
              <text x={placed.x + 6} y={placed.y + 6} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="white" fontStyle="italic">
                i
              </text>
            </g>

            {/* Terminals */}
            {terms.map((t) => {
              const end: WireEnd = { kind: 'component', instanceId: placed.instanceId, terminalId: t.id }
              return (
                <g
                  key={t.id}
                  className="cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onTapEndpoint(end)}
                >
                  <circle
                    cx={t.x}
                    cy={t.y}
                    r={isPending(end) ? 7 : 5}
                    fill={isPending(end) ? '#E8720C' : '#1565C0'}
                    stroke="white"
                    strokeWidth={1}
                  />
                  <text x={t.x} y={t.y + 14} textAnchor="middle" fontSize={8} className="font-mono" fill="#1B2E4B99">
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
