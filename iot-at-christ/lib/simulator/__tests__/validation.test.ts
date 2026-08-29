import { describe, it, expect } from 'vitest'
import { validateCircuit } from '../validation'
import { simulateStep } from '../simulation'
import type { Circuit } from '../../../types/simulator'

// Small helpers to keep test circuits readable.
const place = (instanceId: string, componentId: Circuit['components'][number]['componentId'], x = 0, y = 0) => ({
  instanceId,
  componentId,
  x,
  y,
})

const wire = (id: string, from: Circuit['wires'][number]['from'], to: Circuit['wires'][number]['to']) => ({ id, from, to })

describe('validateCircuit', () => {
  const hasCode = (circuit: Circuit, code: string) => validateCircuit(circuit).issues.some((issue) => issue.code === code)
  const oneSignal = (boardId: Circuit['boardId'], componentId: Circuit['components'][number]['componentId'], terminalId: string, pinId: string): Circuit => ({
    boardId, components: [place('part', componentId)],
    wires: [wire('signal', { kind: 'component', instanceId: 'part', terminalId }, { kind: 'board', pinId })],
  })

  it('rejects a 5V signal entering a 3.3V-only GPIO and recommends level conversion', () => {
    const result = validateCircuit(oneSignal('esp32-devkit', 'hc-sr04', 'echo', 'gpio19'))
    expect(result.issues.find((issue) => issue.code === 'logic-overvoltage')?.message).toMatch(/divider|level shifter/)
  })

  it('rejects an ESP32 input-only pin used to drive an output', () => {
    expect(hasCode(oneSignal('esp32-devkit', 'led', 'anode', 'gpio34'), 'input-only-output')).toBe(true)
  })

  it('rejects a high-current load driven directly by GPIO', () => {
    expect(hasCode(oneSignal('arduino-uno', 'buzzer', 'positive', 'd3'), 'direct-load-drive')).toBe(true)
  })

  it('requires flyback protection for a directly switched inductive load', () => {
    expect(hasCode(oneSignal('arduino-uno', 'buzzer', 'positive', 'd3'), 'inductive-protection')).toBe(true)
  })

  it('warns when a board rail is used for a large external load', () => {
    expect(hasCode(oneSignal('arduino-uno', 'servo-motor', 'vcc', '5v'), 'rail-overload')).toBe(true)
  })

  it('requires a common board ground for an externally supplied load', () => {
    expect(hasCode(oneSignal('arduino-uno', 'servo-motor', 'vcc', '5v'), 'missing-common-ground')).toBe(true)
  })

  it('warns when an open signal has no pull-up', () => {
    expect(hasCode(oneSignal('arduino-uno', 'push-button', 'pin1', 'd2'), 'missing-pull-up')).toBe(true)
  })

  it('warns when a PWM terminal uses a non-PWM pin', () => {
    expect(hasCode(oneSignal('arduino-uno', 'servo-motor', 'signal', 'd13'), 'pwm-incompatible')).toBe(true)
  })

  it('warns when independent roles duplicate a GPIO pin', () => {
    const circuit: Circuit = { boardId: 'arduino-uno', components: [place('a', 'pir'), place('b', 'ir-sensor')], wires: [
      wire('a', { kind: 'component', instanceId: 'a', terminalId: 'out' }, { kind: 'board', pinId: 'd2' }),
      wire('b', { kind: 'component', instanceId: 'b', terminalId: 'out' }, { kind: 'board', pinId: 'd2' }),
    ] }
    expect(hasCode(circuit, 'duplicate-pin-role')).toBe(true)
  })

  it('rejects duplicate I2C addresses on one bus', () => {
    const circuit: Circuit = { boardId: 'arduino-uno', components: [place('imu1', 'mpu6050'), place('imu2', 'mpu6050')], wires: [
      wire('a', { kind: 'component', instanceId: 'imu1', terminalId: 'sda' }, { kind: 'board', pinId: 'a4' }),
      wire('b', { kind: 'component', instanceId: 'imu2', terminalId: 'sda' }, { kind: 'board', pinId: 'a4' }),
    ] }
    expect(hasCode(circuit, 'i2c-address-conflict')).toBe(true)
  })
  it('returns an info message for an empty bench', () => {
    const result = validateCircuit({ boardId: 'arduino-uno', components: [], wires: [] })
    expect(result.ok).toBe(true)
    expect(result.issues[0]?.severity).toBe('info')
  })

  it('passes a valid LED + resistor circuit on the Arduino Uno', () => {
    const circuit: Circuit = {
      boardId: 'arduino-uno',
      components: [place('led1', 'led'), place('r1', 'resistor-220')],
      wires: [
        wire('w1', { kind: 'board', pinId: 'd13' }, { kind: 'component', instanceId: 'r1', terminalId: 'leg1' }),
        wire('w2', { kind: 'component', instanceId: 'r1', terminalId: 'leg2' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
        wire('w3', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-1' }),
      ],
    }
    const result = validateCircuit(circuit)
    expect(result.ok).toBe(true)
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('flags an LED wired directly to a pin without a series resistor', () => {
    const circuit: Circuit = {
      boardId: 'arduino-uno',
      components: [place('led1', 'led')],
      wires: [
        wire('w1', { kind: 'board', pinId: 'd13' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
        wire('w2', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-1' }),
      ],
    }
    const result = validateCircuit(circuit)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.severity === 'error' && /series resistor/.test(i.message))).toBe(true)
  })

  it('flags a DHT11 missing its ground connection', () => {
    const circuit: Circuit = {
      boardId: 'arduino-uno',
      components: [place('dht1', 'dht11')],
      wires: [
        wire('w1', { kind: 'board', pinId: '5v' }, { kind: 'component', instanceId: 'dht1', terminalId: 'vcc' }),
        wire('w2', { kind: 'board', pinId: 'd2' }, { kind: 'component', instanceId: 'dht1', terminalId: 'data' }),
      ],
    }
    const result = validateCircuit(circuit)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.severity === 'error' && /ground/.test(i.message))).toBe(true)
  })

  it('flags an analog sensor wired to the Raspberry Pi with an ADC explanation', () => {
    const circuit: Circuit = {
      boardId: 'raspberry-pi-4',
      components: [place('pot1', 'potentiometer')],
      wires: [
        wire('w1', { kind: 'board', pinId: '3v3' }, { kind: 'component', instanceId: 'pot1', terminalId: 'vcc' }),
        wire('w2', { kind: 'board', pinId: 'gnd-9' }, { kind: 'component', instanceId: 'pot1', terminalId: 'gnd' }),
        wire('w3', { kind: 'board', pinId: 'gpio17' }, { kind: 'component', instanceId: 'pot1', terminalId: 'wiper' }),
      ],
    }
    const result = validateCircuit(circuit)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.severity === 'error' && /MCP3008/.test(i.message))).toBe(true)
  })

  it('flags a wire that connects power directly to ground as a short circuit', () => {
    const circuit: Circuit = {
      boardId: 'arduino-uno',
      components: [],
      wires: [wire('w1', { kind: 'board', pinId: '5v' }, { kind: 'board', pinId: 'gnd-1' })],
    }
    const result = validateCircuit(circuit)
    expect(result.ok).toBe(false)
    expect(result.issues.some((i) => i.severity === 'error' && /Short circuit/.test(i.message))).toBe(true)
  })

  it('warns when the HC-SR04 is powered from the ESP32 3.3V rail', () => {
    const circuit: Circuit = {
      boardId: 'esp32-devkit',
      components: [place('us1', 'hc-sr04')],
      wires: [
        wire('w1', { kind: 'board', pinId: '3v3' }, { kind: 'component', instanceId: 'us1', terminalId: 'vcc' }),
        wire('w2', { kind: 'board', pinId: 'gnd-l' }, { kind: 'component', instanceId: 'us1', terminalId: 'gnd' }),
        wire('w3', { kind: 'board', pinId: 'gpio23' }, { kind: 'component', instanceId: 'us1', terminalId: 'trig' }),
        wire('w4', { kind: 'component', instanceId: 'us1', terminalId: 'echo' }, { kind: 'board', pinId: 'gpio19' }),
      ],
    }
    const result = validateCircuit(circuit)
    expect(result.issues.some((i) => i.severity === 'warning' && /3.3V/.test(i.message))).toBe(true)
  })
})

describe('simulateStep', () => {
  const poweredDht11: Circuit = {
    boardId: 'arduino-uno',
    components: [place('dht1', 'dht11')],
    wires: [
      wire('w1', { kind: 'board', pinId: '5v' }, { kind: 'component', instanceId: 'dht1', terminalId: 'vcc' }),
      wire('w2', { kind: 'board', pinId: 'gnd-1' }, { kind: 'component', instanceId: 'dht1', terminalId: 'gnd' }),
      wire('w3', { kind: 'board', pinId: 'd2' }, { kind: 'component', instanceId: 'dht1', terminalId: 'data' }),
    ],
  }

  it('is deterministic for the same circuit and tick', () => {
    const a = simulateStep(poweredDht11, 5)
    const b = simulateStep(poweredDht11, 5)
    expect(a).toEqual(b)
  })

  it('reports both DHT11 readings within their declared ranges', () => {
    const frame = simulateStep(poweredDht11, 3)
    expect(frame.readings).toHaveLength(2)
    const temp = frame.readings.find((r) => r.label === 'Temperature')
    const hum = frame.readings.find((r) => r.label === 'Humidity')
    expect(temp).toBeDefined()
    expect(hum).toBeDefined()
    expect(temp!.value).toBeGreaterThanOrEqual(18)
    expect(temp!.value).toBeLessThanOrEqual(34)
    expect(hum!.value).toBeGreaterThanOrEqual(35)
    expect(hum!.value).toBeLessThanOrEqual(85)
  })
})
