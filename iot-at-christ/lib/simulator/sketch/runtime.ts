// Binds the interpreter's I/O builtins (pinMode/digitalWrite/Serial,
// GPIO.*/print/time.sleep...) to a Circuit, so a sketch "sees" exactly the
// board and wiring the student built on the bench.
//
// Reads (digitalRead/analogRead/GPIO.input) walk the same net model as
// validation/simulation: the board pin's electrical net is searched for a
// connected sensor (or another output pin driven earlier in the same run,
// for loopback wiring), and its deterministic reading is used. Writes
// (digitalWrite/analogWrite/GPIO.output) update actuatorStates for any
// connected LED/buzzer, exactly like the canned simulation does.

import type { Circuit, ComponentId, PinDef, SensorReading, SerialLine, WireEnd } from '@/types/simulator'
import { getBoard } from '../boards'
import { getComponent } from '../components'
import { formatReading, hashStr, readingValue } from '../simulation'
import { pinHint, resolvePinId } from './pin-map'
import {
  Interpreter,
  SketchRuntimeError,
  makeObject,
  nativeFn,
  stringify,
  truthy,
  asNumber,
  type RuntimeValue,
} from './interpreter'

/** Matches the cadence of the canned simulation loop in simulation.ts. */
export const SKETCH_TICK_MS = 800

const endKey = (end: WireEnd): string =>
  end.kind === 'board' ? `board:${end.pinId}` : `comp:${end.instanceId}:${end.terminalId}`

/** Union-find over wire endpoints, with passive (resistor) legs fused. */
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

interface NetTerminal {
  instanceId: string
  componentId: ReturnType<typeof getComponent>['id']
  terminalId: string
  role: ReturnType<typeof getComponent>['terminals'][number]['role']
}

export interface SketchOutput {
  serial: SerialLine[]
  actuatorStates: Record<string, boolean | number>
  readings: Record<string, SensorReading>
  pinModes: Record<string, string>
}

export interface SketchRuntime {
  output: SketchOutput
  install: (interp: Interpreter) => void
}

/**
 * Builds the per-board/per-circuit runtime. `language` selects which global
 * builtins are registered (Arduino-style vs MicroPython-style); the wiring
 * logic underneath is shared.
 */
export function createRuntime(circuit: Circuit, language: 'arduino-cpp' | 'micropython'): SketchRuntime {
  const board = getBoard(circuit.boardId)
  const pinById = new Map(board.pins.map((p) => [p.id, p]))
  const find = buildNetFinder(circuit)

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

  // root -> board pins / component terminals sharing that net
  const rootPins = new Map<string, PinDef[]>()
  const rootTerminals = new Map<string, NetTerminal[]>()
  for (const key of allKeys) {
    const root = find(key)
    if (key.startsWith('board:')) {
      const pin = pinById.get(key.slice('board:'.length))
      if (!pin) continue
      const list = rootPins.get(root)
      if (list) list.push(pin)
      else rootPins.set(root, [pin])
    } else {
      const [, instanceId, terminalId] = key.split(':')
      const placed = circuit.components.find((c) => c.instanceId === instanceId)
      if (!placed) continue
      const def = getComponent(placed.componentId)
      const terminal = def.terminals.find((t) => t.id === terminalId)
      if (!terminal) continue
      const list = rootTerminals.get(root)
      const entry: NetTerminal = { instanceId, componentId: placed.componentId, terminalId, role: terminal.role }
      if (list) list.push(entry)
      else rootTerminals.set(root, [entry])
    }
  }

  const terminalsConnectedTo = (pinId: string): NetTerminal[] => rootTerminals.get(find(`board:${pinId}`)) ?? []
  const pinsConnectedTo = (pinId: string): PinDef[] => rootPins.get(find(`board:${pinId}`)) ?? []

  const output: SketchOutput = { serial: [], actuatorStates: {}, readings: {}, pinModes: {} }
  const pinModes = output.pinModes
  /** Last value a sketch wrote to a pin — lets digitalRead loop back a wire from an output pin. */
  const pinOutputs: Record<string, number> = {}

  let interpRef: Interpreter | null = null

  const adcMax = circuit.boardId === 'esp32-devkit' ? 4095 : 1023

  function virtualMs(): number {
    return interpRef?.virtualMs ?? 0
  }

  function currentTick(): number {
    return Math.floor(virtualMs() / SKETCH_TICK_MS)
  }

  function requirePin(value: RuntimeValue, line: number): string {
    const pinId = resolvePinId(board, value)
    if (!pinId) {
      throw new SketchRuntimeError(
        `'${stringify(value)}' isn't a pin on the ${board.name}. ${pinHint(board)}`,
        line,
      )
    }
    return pinId
  }

  function writePin(pinId: string, level01: number, line: number): void {
    pinOutputs[pinId] = level01
    const terminals = terminalsConnectedTo(pinId).filter((t) => t.role === 'digital-in')
    if (terminals.length === 0) return
    for (const t of terminals) {
      output.actuatorStates[t.instanceId] = level01 >= 1 ? true : level01 <= 0 ? false : level01
    }
  }

  function readDigital(pinId: string, line: number): number {
    const tick = currentTick()
    const terminals = terminalsConnectedTo(pinId)

    const button = terminals.find((t) => t.componentId === 'push-button')
    if (button) return tick % 7 === 0 ? 0 : 1 // INPUT_PULLUP wiring: pressed = LOW

    const pir = terminals.find((t) => t.componentId === 'pir' && t.role === 'digital-out')
    if (pir) {
      const motion = tick % 13 < 2 ? 1 : 0
      recordReading(pir.instanceId, 'pir', 0, tick)
      return motion
    }

    const sensorWithReadings = terminals.find((t) => t.role === 'digital-out' || t.role === 'analog-out')
    if (sensorWithReadings) {
      const value = recordReading(sensorWithReadings.instanceId, sensorWithReadings.componentId, 0, tick)
      if (value !== null) return value > 0 ? 1 : 0
    }

    // Loopback: another pin on the same net that the sketch already drove HIGH/LOW.
    for (const pin of pinsConnectedTo(pinId)) {
      if (pin.id !== pinId && pin.id in pinOutputs) return pinOutputs[pin.id] >= 1 ? 1 : 0
    }

    return 0
  }

  function readAnalog(pinId: string, line: number): number {
    const tick = currentTick()
    const terminals = terminalsConnectedTo(pinId)
    const sensor = terminals.find((t) => t.role === 'analog-out')
    if (!sensor) {
      if (circuit.boardId === 'raspberry-pi-4') {
        throw new SketchRuntimeError(
          'analogRead() has nothing to read — the Raspberry Pi has no built-in ADC. Add an external ADC (MCP3008) or pick a different board.',
          line,
        )
      }
      return 0
    }
    const def = getComponent(sensor.componentId)
    const reading = def.readings?.[0]
    if (!reading) return 0
    const seed = hashStr(sensor.instanceId)
    const raw = readingValue(seed, tick, 0, reading.min, reading.max)
    const formatted = formatReading(raw, reading.unit)
    output.readings[`${sensor.instanceId}:${reading.label}`] = {
      instanceId: sensor.instanceId,
      label: reading.label,
      value: formatted,
      unit: reading.unit,
    }
    const span = reading.max - reading.min
    const normalized = span > 0 ? (raw - reading.min) / span : 0
    return Math.round(normalized * adcMax)
  }

  /** Records a sensor's reading for the panel and returns a 0/1-ish signal for digital use. */
  function recordReading(instanceId: string, componentId: ComponentId, idx: number, tick: number): number | null {
    if (componentId === 'pir') {
      const value = tick % 13 < 2 ? 1 : 0
      output.readings[`${instanceId}:Motion`] = { instanceId, label: 'Motion', value, unit: '' }
      return value
    }
    const def = getComponent(componentId)
    const reading = def.readings?.[idx]
    if (!reading) return null
    const seed = hashStr(instanceId)
    const raw = readingValue(seed, tick, idx, reading.min, reading.max)
    const formatted = formatReading(raw, reading.unit)
    output.readings[`${instanceId}:${reading.label}`] = {
      instanceId,
      label: reading.label,
      value: formatted,
      unit: reading.unit,
    }
    return formatted
  }

  function println(args: RuntimeValue[]): void {
    const text = args.map(stringify).join(' ')
    output.serial.push({ tick: currentTick(), text })
  }

  function deterministicRandom(seed2: number): number {
    const x = Math.sin(virtualMs() * 12.9898 + seed2 * 78.233) * 43758.5453
    return x - Math.floor(x)
  }

  function install(interp: Interpreter): void {
    interpRef = interp

    // --- Shared numeric helpers -------------------------------------------
    interp.defineGlobal('map', nativeFn('map', (a, line) => {
      const [x, inMin, inMax, outMin, outMax] = a.map((v) => asNumber(v, line))
      const span = inMax - inMin
      const t = span === 0 ? 0 : (x - inMin) / span
      return outMin + t * (outMax - outMin)
    }))
    interp.defineGlobal('constrain', nativeFn('constrain', (a, line) => {
      const [x, lo, hi] = a.map((v) => asNumber(v, line))
      return Math.min(hi, Math.max(lo, x))
    }))
    interp.defineGlobal('abs', nativeFn('abs', (a, line) => Math.abs(asNumber(a[0], line))))
    interp.defineGlobal('min', nativeFn('min', (a, line) => Math.min(asNumber(a[0], line), asNumber(a[1], line))))
    interp.defineGlobal('max', nativeFn('max', (a, line) => Math.max(asNumber(a[0], line), asNumber(a[1], line))))

    if (language === 'arduino-cpp') installArduino(interp)
    else installMicroPython(interp)
  }

  function installArduino(interp: Interpreter): void {
    interp.defineGlobal('HIGH', 1)
    interp.defineGlobal('LOW', 0)
    interp.defineGlobal('INPUT', 'INPUT')
    interp.defineGlobal('OUTPUT', 'OUTPUT')
    interp.defineGlobal('INPUT_PULLUP', 'INPUT_PULLUP')
    interp.defineGlobal('LED_BUILTIN', 13)
    for (let i = 0; i <= 5; i++) interp.defineGlobal(`A${i}`, `A${i}`)
    for (let i = 0; i <= 8; i++) interp.defineGlobal(`D${i}`, `D${i}`)

    interp.defineGlobal('pinMode', nativeFn('pinMode', (args, line) => {
      const pinId = requirePin(args[0], line)
      pinModes[pinId] = String(args[1])
      return undefined
    }))
    interp.defineGlobal('digitalWrite', nativeFn('digitalWrite', (args, line) => {
      const pinId = requirePin(args[0], line)
      writePin(pinId, asNumber(args[1], line) >= 1 ? 1 : 0, line)
      return undefined
    }))
    interp.defineGlobal('digitalRead', nativeFn('digitalRead', (args, line) => readDigital(requirePin(args[0], line), line)))
    interp.defineGlobal('analogRead', nativeFn('analogRead', (args, line) => readAnalog(requirePin(args[0], line), line)))
    interp.defineGlobal('analogWrite', nativeFn('analogWrite', (args, line) => {
      const pinId = requirePin(args[0], line)
      const level = Math.min(255, Math.max(0, asNumber(args[1], line))) / 255
      writePin(pinId, level, line)
      return undefined
    }))
    interp.defineGlobal('delay', nativeFn('delay', (args, line) => {
      interp.advanceTime(asNumber(args[0], line))
      return undefined
    }))
    interp.defineGlobal('delayMicroseconds', nativeFn('delayMicroseconds', (args, line) => {
      interp.advanceTime(asNumber(args[0], line) / 1000)
      return undefined
    }))
    interp.defineGlobal('millis', nativeFn('millis', () => Math.round(virtualMs())))
    interp.defineGlobal('random', nativeFn('random', (args, line) => {
      const r = deterministicRandom(interp.steps)
      if (args.length === 0) return Math.floor(r * 100)
      if (args.length === 1) return Math.floor(r * asNumber(args[0], line))
      const lo = asNumber(args[0], line)
      const hi = asNumber(args[1], line)
      return lo + Math.floor(r * (hi - lo))
    }))

    interp.defineGlobal('Serial', makeObject('Serial', {
      begin: nativeFn('Serial.begin', () => undefined),
      print: nativeFn('Serial.print', (args) => {
        println(args)
        return undefined
      }),
      println: nativeFn('Serial.println', (args) => {
        println(args.length ? args : [''])
        return undefined
      }),
    }))
  }

  function installMicroPython(interp: Interpreter): void {
    const GPIO = makeObject('GPIO', {
      OUT: 'OUT',
      IN: 'IN',
      HIGH: 1,
      LOW: 0,
      BCM: 'BCM',
      BOARD: 'BOARD',
      PUD_UP: 'PUD_UP',
      PUD_DOWN: 'PUD_DOWN',
      setmode: nativeFn('GPIO.setmode', () => undefined),
      setwarnings: nativeFn('GPIO.setwarnings', () => undefined),
      setup: nativeFn('GPIO.setup', (args, line) => {
        const pinId = requirePin(args[0], line)
        pinModes[pinId] = stringify(args[1])
        return undefined
      }),
      output: nativeFn('GPIO.output', (args, line) => {
        const pinId = requirePin(args[0], line)
        writePin(pinId, truthy(args[1]) && asNumber(args[1], line) !== 0 ? 1 : 0, line)
        return undefined
      }),
      input: nativeFn('GPIO.input', (args, line) => readDigital(requirePin(args[0], line), line)),
      cleanup: nativeFn('GPIO.cleanup', () => undefined),
      PWM: nativeFn('GPIO.PWM', (args, line) => {
        const pinId = requirePin(args[0], line)
        return makeObject('PWM', {
          start: nativeFn('PWM.start', (a) => {
            writePin(pinId, Math.min(100, Math.max(0, asNumber(a[0], line))) / 100, line)
            return undefined
          }),
          ChangeDutyCycle: nativeFn('PWM.ChangeDutyCycle', (a) => {
            writePin(pinId, Math.min(100, Math.max(0, asNumber(a[0], line))) / 100, line)
            return undefined
          }),
          stop: nativeFn('PWM.stop', () => {
            writePin(pinId, 0, line)
            return undefined
          }),
        })
      }),
    })
    interp.defineGlobal('GPIO', GPIO)

    interp.defineGlobal('time', makeObject('time', {
      sleep: nativeFn('time.sleep', (args, line) => {
        interp.advanceTime(asNumber(args[0], line) * 1000)
        return undefined
      }),
      time: nativeFn('time.time', () => virtualMs() / 1000),
    }))

    interp.defineGlobal('print', nativeFn('print', (args) => {
      println(args)
      return undefined
    }))
  }

  return { output, install }
}
