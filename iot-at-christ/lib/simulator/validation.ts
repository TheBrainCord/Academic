import type {
  Circuit,
  PinDef,
  TerminalRole,
  ValidationIssue,
  ValidationResult,
  WireEnd,
} from '@/types/simulator'
import { getBoard } from './boards'
import { getComponent } from './components'

const endKey = (end: WireEnd): string =>
  end.kind === 'board' ? `board:${end.pinId}` : `comp:${end.instanceId}:${end.terminalId}`

const isPowerPin = (pin: PinDef): boolean =>
  pin.capabilities.includes('power-5v') || pin.capabilities.includes('power-3v3')

const isGroundPin = (pin: PinDef): boolean => pin.capabilities.includes('ground')

const DATA_ROLES: ReadonlySet<TerminalRole> = new Set(['digital-out', 'analog-out', 'digital-in'])

interface Nets {
  /** All node keys electrically connected to `key` (including itself). */
  netOf(key: string): string[]
}

/**
 * Union-find over wire endpoints. When `throughPassives` is true, the two legs
 * of a passive component (the resistor) are fused, so a net "flows through" it
 * — that is how "powered through a resistor" still counts as powered.
 */
const buildNets = (circuit: Circuit, throughPassives: boolean): Nets => {
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

  if (throughPassives) {
    for (const placed of circuit.components) {
      const legs = getComponent(placed.componentId).terminals.filter((t) => t.role === 'passive')
      for (let i = 1; i < legs.length; i++) {
        union(`comp:${placed.instanceId}:${legs[0].id}`, `comp:${placed.instanceId}:${legs[i].id}`)
      }
    }
  }

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

  const members = new Map<string, string[]>()
  for (const key of allKeys) {
    const root = find(key)
    const list = members.get(root)
    if (list) list.push(key)
    else members.set(root, [key])
  }

  return {
    netOf: (key: string): string[] => members.get(find(key)) ?? [key],
  }
}

/**
 * Board pins electrically reachable from one component terminal, with
 * resistors passing nets through — shared with the challenge checker so it
 * sees circuits exactly the way validation does.
 */
export function boardPinsReachableFrom(
  circuit: Circuit,
  instanceId: string,
  terminalId: string,
): PinDef[] {
  const board = getBoard(circuit.boardId)
  const pinById = new Map(board.pins.map((p) => [p.id, p]))
  return buildNets(circuit, true)
    .netOf(`comp:${instanceId}:${terminalId}`)
    .filter((key) => key.startsWith('board:'))
    .map((key) => pinById.get(key.slice('board:'.length)))
    .filter((p): p is PinDef => p !== undefined)
}

function validateCore(circuit: Circuit): ValidationResult {
  const issues: ValidationIssue[] = []
  const board = getBoard(circuit.boardId)
  const pinById = new Map(board.pins.map((p) => [p.id, p]))

  if (circuit.components.length === 0 && circuit.wires.length === 0) {
    return {
      ok: true,
      issues: [{ severity: 'info', code: 'not-wired', message: 'Drag a component onto the bench to get started' }],
    }
  }

  const merged = buildNets(circuit, true)
  const strict = buildNets(circuit, false)

  const pinsIn = (keys: string[]): PinDef[] =>
    keys
      .filter((k) => k.startsWith('board:'))
      .map((k) => pinById.get(k.slice('board:'.length)))
      .filter((p): p is PinDef => p !== undefined)

  const wiredKeys = new Set<string>()
  for (const wire of circuit.wires) {
    wiredKeys.add(endKey(wire.from))
    wiredKeys.add(endKey(wire.to))
  }

  // (f) A single wire tying a power pin to a ground pin
  for (const wire of circuit.wires) {
    if (wire.from.kind !== 'board' || wire.to.kind !== 'board') continue
    const a = pinById.get(wire.from.pinId)
    const b = pinById.get(wire.to.pinId)
    if (!a || !b) continue
    if ((isPowerPin(a) && isGroundPin(b)) || (isGroundPin(a) && isPowerPin(b))) {
      issues.push({
        severity: 'error',
        code: 'short-circuit',
        wireId: wire.id,
        message: `Short circuit! ${a.label} is wired straight to ${b.label} — never connect power directly to ground.`,
      })
    }
  }

  for (const placed of circuit.components) {
    const def = getComponent(placed.componentId)
    const keyOf = (terminalId: string): string => `comp:${placed.instanceId}:${terminalId}`

    const hasAnyWire = def.terminals.some((t) => wiredKeys.has(keyOf(t.id)))
    if (!hasAnyWire) {
      issues.push({
        severity: 'info',
        code: 'not-wired',
        instanceId: placed.instanceId,
        message: `${def.name} is on the bench but not wired yet`,
      })
      continue
    }

    for (const terminal of def.terminals) {
      const netPins = pinsIn(merged.netOf(keyOf(terminal.id)))
      const powerPins = netPins.filter(isPowerPin)
      const groundPins = netPins.filter(isGroundPin)

      switch (terminal.role) {
        case 'vcc': {
          if (powerPins.length === 0) {
            issues.push({
              severity: 'error',
              code: 'no-power',
              instanceId: placed.instanceId,
              message: `${def.name} has no power connection — wire its ${terminal.label} terminal to a power pin (5V or 3.3V).`,
            })
            break
          }
          for (const pin of powerPins) {
            const rail = pin.capabilities.includes('power-5v') ? 5 : 3.3
            if (rail > def.maxVoltage) {
              issues.push({
                severity: 'error',
                code: 'overvoltage',
                instanceId: placed.instanceId,
                pinId: pin.id,
                message: `${pin.label} supplies ${rail}V but ${def.name} tolerates at most ${def.maxVoltage}V — that would damage it. Use a lower-voltage rail.`,
              })
            } else if (def.minVoltage > rail) {
              issues.push({
                severity: 'warning',
                code: 'undervoltage',
                instanceId: placed.instanceId,
                pinId: pin.id,
                message: `${def.name} needs at least ${def.minVoltage}V but ${pin.label} only supplies ${rail}V — it may be unreliable at ${rail}V.`,
              })
            }
          }
          break
        }
        case 'gnd': {
          if (groundPins.length === 0) {
            issues.push({
              severity: 'error',
              code: 'no-ground',
              instanceId: placed.instanceId,
              message: `${def.name}'s ${terminal.label} terminal isn't connected to ground — every circuit needs a path back to a GND pin.`,
            })
          }
          break
        }
        case 'digital-out':
        case 'digital-in': {
          if (netPins.length === 0) {
            issues.push({
              severity: 'error',
              code: 'floating-signal',
              instanceId: placed.instanceId,
              message: `${def.name}'s ${terminal.label} terminal isn't connected to any board pin — its signal has nowhere to go.`,
            })
          } else if (powerPins.length > 0 || groundPins.length > 0) {
            const kind = powerPins.length > 0 ? 'power' : 'ground'
            issues.push({
              severity: 'error',
              code: 'signal-short',
              instanceId: placed.instanceId,
              message: `${def.name}'s ${terminal.label} terminal is wired straight to a ${kind} pin — that's a short circuit in the making. Signal terminals belong on GPIO pins.`,
            })
          }
          break
        }
        case 'analog-out': {
          if (netPins.length === 0) {
            issues.push({
              severity: 'error',
              code: 'floating-signal',
              instanceId: placed.instanceId,
              message: `${def.name}'s ${terminal.label} terminal isn't connected to any board pin — its signal has nowhere to go.`,
            })
            break
          }
          for (const pin of netPins) {
            if (pin.capabilities.includes('analog-in')) continue
            if (circuit.boardId === 'raspberry-pi-4' && !board.hasAnalogIn) {
              issues.push({
                severity: 'error',
                code: 'no-adc-on-board',
                instanceId: placed.instanceId,
                pinId: pin.id,
                message: `The Raspberry Pi has no analog inputs (no ADC), so it can't read ${def.name}'s ${terminal.label} directly. Add an external ADC chip like the MCP3008, or pick a board with analog pins.`,
              })
            } else {
              issues.push({
                severity: 'error',
                code: 'analog-on-digital',
                instanceId: placed.instanceId,
                pinId: pin.id,
                message: `${def.name}'s ${terminal.label} outputs an analog signal, but ${pin.label} can't read analog. Move the wire to an analog-in pin.`,
              })
            }
          }
          break
        }
        case 'passive':
          break
      }
    }

    // (g) requiresSeriesResistor: the strict (no pass-through) net tells us
    // whether the signal terminal touches a board pin without a resistor between.
    if (def.requiresSeriesResistor) {
      for (const terminal of def.terminals) {
        if (terminal.role === 'gnd') continue
        if (pinsIn(strict.netOf(keyOf(terminal.id))).length > 0) {
          issues.push({
            severity: 'error',
            code: 'missing-resistor',
            instanceId: placed.instanceId,
            message: 'LED needs a series resistor (try the 220Ω) or it will burn out',
          })
        }
      }
    }
  }

  // (i) Two or more data terminals sharing one board pin
  const reportedPins = new Set<string>()
  const componentById = new Map(circuit.components.map((c) => [c.instanceId, c]))
  for (const wire of circuit.wires) {
    for (const end of [wire.from, wire.to]) {
      if (end.kind !== 'board') continue
      const pin = pinById.get(end.pinId)
      if (!pin || reportedPins.has(pin.id) || isPowerPin(pin) || isGroundPin(pin)) continue
      const dataTerminals = merged.netOf(`board:${pin.id}`).filter((key) => {
        if (!key.startsWith('comp:')) return false
        const [, instanceId, terminalId] = key.split(':')
        const owner = componentById.get(instanceId)
        if (!owner) return false
        const terminal = getComponent(owner.componentId).terminals.find((t) => t.id === terminalId)
        return terminal !== undefined && DATA_ROLES.has(terminal.role)
      })
      if (dataTerminals.length >= 2) {
        reportedPins.add(pin.id)
        issues.push({
          severity: 'warning',
          code: 'pin-conflict',
          pinId: pin.id,
          message: `Pin ${pin.label} has ${dataTerminals.length} data signals wired to it — a pin can only serve one signal at a time.`,
        })
      }
    }
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues }
}

/** A validation rule is a pure function. Rules never mutate the circuit or one another's output. */
export type ValidationRule = (circuit: Circuit) => ValidationIssue[]

interface ConnectedTerminal {
  instanceId: string
  componentName: string
  terminal: ReturnType<typeof getComponent>['terminals'][number]
  pins: PinDef[]
}

const connectedTerminals = (circuit: Circuit): ConnectedTerminal[] =>
  circuit.components.flatMap((placed) => {
    const component = getComponent(placed.componentId)
    return component.terminals.map((terminal) => ({
      instanceId: placed.instanceId,
      componentName: component.name,
      terminal,
      pins: boardPinsReachableFrom(circuit, placed.instanceId, terminal.id),
    }))
  })

const logicOvervoltageRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit).flatMap(({ instanceId, componentName, terminal, pins }) => {
    if (terminal.outputVoltage === undefined) return []
    return pins
      .filter((pin) => !isPowerPin(pin) && !isGroundPin(pin) && terminal.outputVoltage! > (pin.maxInputVoltage ?? getBoard(circuit.boardId).logicVoltage))
      .map((pin) => ({
        severity: 'error' as const, code: 'logic-overvoltage' as const, instanceId, pinId: pin.id,
        message: `${componentName} ${terminal.label} can drive ${terminal.outputVoltage}V into ${pin.label}, whose input is limited to ${pin.maxInputVoltage ?? getBoard(circuit.boardId).logicVoltage}V. The GPIO protection structures can conduct and the chip may be permanently damaged; use a resistor divider or a proper level shifter.`,
      }))
  })

const inputOnlyOutputRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit).flatMap(({ instanceId, componentName, terminal, pins }) => {
    if (terminal.role !== 'digital-in') return []
    return pins.filter((pin) => pin.direction === 'input').map((pin) => ({
      severity: 'error' as const, code: 'input-only-output' as const, instanceId, pinId: pin.id,
      message: `${pin.label} is input-only but ${componentName} ${terminal.label} needs the board to drive an output. It cannot source a logic level, so the actuator will not operate; move it to an output-capable GPIO.`,
    }))
  })

const directLoadDriveRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit).flatMap(({ instanceId, componentName, terminal, pins }) => {
    if (!terminal.requiresDriver || pins.every((pin) => isPowerPin(pin) || isGroundPin(pin))) return []
    return pins.filter((pin) => !isPowerPin(pin) && !isGroundPin(pin)).map((pin) => ({
      severity: 'error' as const, code: 'direct-load-drive' as const, instanceId, pinId: pin.id,
      message: `${componentName} draws about ${terminal.currentRequirementMa ?? 'far more than GPIO'}mA and is connected directly to ${pin.label}. GPIO cannot supply that load, causing voltage collapse, overheating, or pin damage; use a ${terminal.requiresDriver === 'h-bridge' ? 'transistor/MOSFET H-bridge' : terminal.requiresDriver + ' driver'} powered from a suitable external supply.`,
    }))
  })

const inductiveProtectionRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit)
    .filter(({ terminal, pins }) => terminal.requiresFlybackDiode && terminal.requiresDriver !== 'h-bridge' && pins.some((p) => !isPowerPin(p) && !isGroundPin(p)))
    .map(({ instanceId, componentName }) => ({
      severity: 'error', code: 'inductive-protection', instanceId,
      message: `${componentName} is an inductive load: when switched off its collapsing magnetic field creates a reverse-voltage spike that can destroy the GPIO or driver. Switch it with a transistor/MOSFET and place a flyback diode across the coil (or use a protected driver module).`,
    }))

const railCurrentRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit)
    .filter(({ terminal, pins }) => terminal.role === 'vcc' && (terminal.requiresExternalSupply || (terminal.currentRequirementMa ?? 0) > 100) && pins.some(isPowerPin))
    .map(({ instanceId, componentName, terminal }) => ({
      severity: 'warning', code: 'rail-overload', instanceId,
      message: `${componentName} may draw ${terminal.currentRequirementMa ?? 'high'}mA from the board rail. Motors and other external loads can overload the regulator or cause brownouts and resets; use a correctly rated external supply rather than sourcing the load from the board.`,
    }))

const commonGroundRule: ValidationRule = (circuit) => {
  const all = connectedTerminals(circuit)
  const externalInstances = new Set(all.filter(({ terminal }) => terminal.requiresExternalSupply).map(({ instanceId }) => instanceId))
  return [...externalInstances].sort().flatMap((instanceId) => {
    const terminals = all.filter((item) => item.instanceId === instanceId)
    if (terminals.some(({ terminal, pins }) => terminal.role === 'gnd' && pins.some(isGroundPin))) return []
    const name = terminals[0]?.componentName ?? 'External load'
    return [{ severity: 'error', code: 'missing-common-ground', instanceId, message: `${name} uses an external supply but has no common ground with the board. Without the shared reference its control voltage is undefined and operation may be erratic; connect external-supply negative to board GND (never tie unlike positive rails together).` }]
  })
}

const pullUpRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit)
    .filter(({ terminal, pins }) => terminal.requiresPullUp && pins.length > 0 && !pins.some(isPowerPin))
    .map(({ instanceId, componentName, terminal }) => ({
      severity: 'warning', code: 'missing-pull-up', instanceId,
      message: `${componentName} ${terminal.label} is open-drain/open-switch and has no pull-up path, so it floats and produces random logic readings. Add an appropriate pull-up resistor to the board's logic rail (or explicitly enable a supported internal pull-up).`,
    }))

const pwmRule: ValidationRule = (circuit) =>
  connectedTerminals(circuit).flatMap(({ instanceId, componentName, terminal, pins }) => {
    if (!terminal.requiresPwm) return []
    return pins.filter((pin) => !pin.capabilities.includes('pwm') && pin.pwm !== true && !isPowerPin(pin) && !isGroundPin(pin)).map((pin) => ({
      severity: 'warning' as const, code: 'pwm-incompatible' as const, instanceId, pinId: pin.id,
      message: `${componentName} ${terminal.label} needs a timed PWM waveform, but ${pin.label} has no PWM output. The load cannot be speed/position controlled correctly; move the signal to a PWM-capable pin or use an external PWM driver.`,
    }))
  })

const duplicatePinRoleRule: ValidationRule = (circuit) => {
  const uses = new Map<string, ConnectedTerminal[]>()
  for (const item of connectedTerminals(circuit)) for (const pin of item.pins) {
    if (!DATA_ROLES.has(item.terminal.role) || isPowerPin(pin) || isGroundPin(pin) || item.terminal.bus === 'i2c') continue
    const list = uses.get(pin.id) ?? []
    list.push(item); uses.set(pin.id, list)
  }
  return [...uses.entries()].sort(([a], [b]) => a.localeCompare(b)).flatMap(([pinId, items]) => {
    const roles = new Set(items.map(({ instanceId, terminal }) => `${instanceId}:${terminal.id}`))
    if (roles.size < 2) return []
    return [{ severity: 'warning', code: 'duplicate-pin-role', pinId, message: `${getBoard(circuit.boardId).pins.find((p) => p.id === pinId)?.label ?? pinId} is assigned ${roles.size} independent signal roles. Their drivers may contend (causing wrong readings or hardware damage); give each signal its own GPIO, except devices intentionally sharing a bus.` }]
  })
}

const i2cAddressRule: ValidationRule = (circuit) => {
  const devices = connectedTerminals(circuit).filter(({ terminal, pins }) => terminal.i2cAddress !== undefined && terminal.bus === 'i2c' && pins.some((p) => p.capabilities.includes('i2c-sda')))
  const groups = new Map<number, ConnectedTerminal[]>()
  for (const device of devices) {
    const list = groups.get(device.terminal.i2cAddress!) ?? []
    if (!list.some((x) => x.instanceId === device.instanceId)) list.push(device)
    groups.set(device.terminal.i2cAddress!, list)
  }
  return [...groups.entries()].sort(([a], [b]) => a - b).flatMap(([address, items]) => items.length < 2 ? [] : [{
    severity: 'error', code: 'i2c-address-conflict', instanceId: items[0].instanceId,
    message: `${items.length} I²C devices share address 0x${address.toString(16).padStart(2, '0')} on the same bus, so both answer and corrupt communication. Change a configurable address, use an I²C multiplexer, or place one device on another bus.`,
  }])
}

export const VALIDATION_RULES: readonly ValidationRule[] = [
  logicOvervoltageRule, inputOnlyOutputRule, directLoadDriveRule, inductiveProtectionRule,
  railCurrentRule, commonGroundRule, pullUpRule, pwmRule, duplicatePinRoleRule, i2cAddressRule,
]

export function validateCircuit(circuit: Circuit): ValidationResult {
  const issues = [...validateCore(circuit).issues, ...VALIDATION_RULES.flatMap((rule) => rule(circuit))]
  return { ok: issues.every((issue) => issue.severity !== 'error'), issues }
}
