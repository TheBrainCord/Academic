import type {
  Circuit,
  PinDef,
  SensorReading,
  SerialLine,
  SimulationFrame,
  WireEnd,
} from '@/types/simulator'
import { getBoard } from './boards'
import { getComponent } from './components'

const endKey = (end: WireEnd): string =>
  end.kind === 'board' ? `board:${end.pinId}` : `comp:${end.instanceId}:${end.terminalId}`

/**
 * Union-find over wire endpoints, with the two legs of every passive
 * component (resistors) fused — mirrors validation's net logic so a sensor
 * "powered through a resistor" is still treated as connected.
 */
function buildNetFinder(circuit: Circuit): (key: string) => string {
  const parent = new Map<string, string>()
  const find = (key: string): string => {
    let current = key
    for (;;) {
      const up = parent.get(current)
      if (up === undefined || up === current) return current
      current = up
    }
  }
  const union = (a: string, b: string): void => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootA, rootB)
  }
  for (const wire of circuit.wires) union(endKey(wire.from), endKey(wire.to))
  for (const placed of circuit.components) {
    const legs = getComponent(placed.componentId).terminals.filter((t) => t.role === 'passive')
    for (let i = 1; i < legs.length; i++) {
      union(`comp:${placed.instanceId}:${legs[0].id}`, `comp:${placed.instanceId}:${legs[i].id}`)
    }
  }
  return find
}

// Deterministic 0..1 pseudo-random value from two integer-ish seeds —
// no Math.random, so the same (circuit, tick) always produces the same frame.
export function noise(seedA: number, seedB: number): number {
  const x = Math.sin(seedA * 12.9898 + seedB * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 100000
}

export function readingValue(seed: number, tick: number, idx: number, min: number, max: number): number {
  const range = max - min
  const center = min + range * (0.3 + 0.4 * noise(seed + idx * 17, 1))
  const drift = Math.sin(tick * 0.08 + seed * 0.01 + idx) * range * 0.15
  const jitter = (noise(seed + idx * 31, tick) - 0.5) * range * 0.05
  return Math.min(max, Math.max(min, center + drift + jitter))
}

export function formatReading(value: number, unit: string): number {
  return unit === 'raw' || unit === '' ? Math.round(value) : Math.round(value * 10) / 10
}

export function simulateStep(circuit: Circuit, tick: number): SimulationFrame {
  const board = getBoard(circuit.boardId)
  const pinById = new Map(board.pins.map((p) => [p.id, p]))
  const find = buildNetFinder(circuit)

  // Group every key that appears in the circuit by its net root, so we can
  // ask "which board pins is this terminal electrically connected to?"
  const allKeys = new Set<string>()
  for (const wire of circuit.wires) {
    allKeys.add(endKey(wire.from))
    allKeys.add(endKey(wire.to))
  }
  for (const placed of circuit.components) {
    for (const t of getComponent(placed.componentId).terminals) {
      allKeys.add(`comp:${placed.instanceId}:${t.id}`)
    }
  }

  const rootPins = new Map<string, PinDef[]>()
  for (const key of allKeys) {
    if (!key.startsWith('board:')) continue
    const pin = pinById.get(key.slice('board:'.length))
    if (!pin) continue
    const root = find(key)
    const list = rootPins.get(root)
    if (list) list.push(pin)
    else rootPins.set(root, [pin])
  }
  const connectedPins = (key: string): PinDef[] => rootPins.get(find(key)) ?? []

  const wiredKeys = new Set<string>()
  for (const wire of circuit.wires) {
    wiredKeys.add(endKey(wire.from))
    wiredKeys.add(endKey(wire.to))
  }

  const readings: SensorReading[] = []
  const actuatorStates: Record<string, boolean | number> = {}
  const serial: SerialLine[] = []

  if (tick === 0) {
    serial.push({ tick, text: `Booting ${board.name}...` })
    serial.push({ tick, text: 'Setup complete. Reading sensors...' })
  }

  for (const placed of circuit.components) {
    const def = getComponent(placed.componentId)
    const keyOf = (terminalId: string): string => `comp:${placed.instanceId}:${terminalId}`
    const seed = hashStr(placed.instanceId)

    const vcc = def.terminals.find((t) => t.role === 'vcc')
    const gnd = def.terminals.find((t) => t.role === 'gnd')

    if (def.readings && def.readings.length > 0) {
      const powered =
        (!vcc || wiredKeys.has(keyOf(vcc.id))) && (!gnd || wiredKeys.has(keyOf(gnd.id)))
      if (!powered) continue

      const values = def.readings.map((r, idx) => {
        let raw: number
        if (def.id === 'pir') {
          raw = tick % 13 < 2 ? 1 : 0
        } else {
          raw = readingValue(seed, tick, idx, r.min, r.max)
        }
        return { ...r, value: formatReading(raw, r.unit) }
      })

      for (const v of values) {
        readings.push({
          instanceId: placed.instanceId,
          label: v.label,
          value: v.value,
          unit: v.unit,
        })
      }

      const reading = values.map((v) => `${v.label}: ${v.value}${v.unit ? ` ${v.unit}` : ''}`).join('  ')
      if (def.id === 'pir') {
        if (values[0].value === 1) serial.push({ tick, text: `[${def.name}] Motion detected!` })
      } else {
        serial.push({ tick, text: `[${def.name}] ${reading}` })
      }
      continue
    }

    if (def.id === 'push-button') {
      const pressed = tick % 7 === 0
      actuatorStates[placed.instanceId] = pressed
      if (pressed) serial.push({ tick, text: `[${def.name}] Pressed` })
      continue
    }

    // Actuators (LED, buzzer): driven by whichever board pin their
    // 'digital-in' terminal is connected to.
    const driveTerminal = def.terminals.find((t) => t.role === 'digital-in')
    if (driveTerminal) {
      const drivers = connectedPins(keyOf(driveTerminal.id))
      if (drivers.length === 0) continue
      const pwmPin = drivers.find((p) => p.capabilities.includes('pwm'))
      if (pwmPin) {
        const level = Math.round(((Math.sin(tick * 0.3) + 1) / 2) * 100) / 100
        actuatorStates[placed.instanceId] = level
        serial.push({ tick, text: `[${def.name}] PWM ${Math.round(level * 100)}%` })
      } else {
        const on = tick % 2 === 0
        actuatorStates[placed.instanceId] = on
        serial.push({ tick, text: `[${def.name}] ${on ? 'ON' : 'OFF'}` })
      }
    }
  }

  return { tick, readings, actuatorStates, serial }
}
