import { describe, it, expect } from 'vitest'
import { getChallenge } from '../challenges'
import { validateCircuit } from '../validation'
import type { Circuit } from '../../../types/simulator'

const place = (instanceId: string, componentId: Circuit['components'][number]['componentId']) => ({
  instanceId,
  componentId,
  x: 0,
  y: 0,
})

const wire = (id: string, from: Circuit['wires'][number]['from'], to: Circuit['wires'][number]['to']) => ({ id, from, to })

const check = (id: string, circuit: Circuit) =>
  getChallenge(id)!.check(circuit, validateCircuit(circuit))

const ledResistorOnUno: Circuit = {
  boardId: 'arduino-uno',
  components: [place('led1', 'led'), place('r1', 'resistor-220')],
  wires: [
    wire('w1', { kind: 'board', pinId: 'd9' }, { kind: 'component', instanceId: 'r1', terminalId: 'leg1' }),
    wire('w2', { kind: 'component', instanceId: 'r1', terminalId: 'leg2' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
    wire('w3', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-1' }),
  ],
}

describe('challenge checker', () => {
  it('completes First Light with a valid LED + resistor circuit', () => {
    const result = check('first-light', ledResistorOnUno)
    expect(result.complete).toBe(true)
  })

  it('does not complete First Light without the resistor in series', () => {
    const noResistor: Circuit = {
      boardId: 'arduino-uno',
      components: [place('led1', 'led')],
      wires: [
        wire('w1', { kind: 'board', pinId: 'd9' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
        wire('w2', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-1' }),
      ],
    }
    const result = check('first-light', noResistor)
    expect(result.complete).toBe(false)
    // The wiring requirement is met but validation must flag the missing resistor.
    expect(result.requirements.find((r) => r.id === 'valid')?.met).toBe(false)
  })

  it('completes Breathing LED only on a PWM pin', () => {
    // d9 is PWM-capable, so the same circuit breathes.
    expect(check('breathing-led', ledResistorOnUno).complete).toBe(true)

    const onPlainDigital: Circuit = {
      ...ledResistorOnUno,
      wires: [
        wire('w1', { kind: 'board', pinId: 'd13' }, { kind: 'component', instanceId: 'r1', terminalId: 'leg1' }),
        ...ledResistorOnUno.wires.slice(1),
      ],
    }
    expect(check('breathing-led', onPlainDigital).complete).toBe(false)
  })

  it('requires the right board for the Weather Station', () => {
    const dhtOnEsp32: Circuit = {
      boardId: 'esp32-devkit',
      components: [place('dht1', 'dht11')],
      wires: [
        wire('w1', { kind: 'board', pinId: '3v3' }, { kind: 'component', instanceId: 'dht1', terminalId: 'vcc' }),
        wire('w2', { kind: 'board', pinId: 'gnd-l' }, { kind: 'component', instanceId: 'dht1', terminalId: 'gnd' }),
        wire('w3', { kind: 'board', pinId: 'gpio4' }, { kind: 'component', instanceId: 'dht1', terminalId: 'data' }),
      ],
    }
    expect(check('weather-station', dhtOnEsp32).complete).toBe(true)

    const wrongBoard = { ...dhtOnEsp32, boardId: 'arduino-uno' as const, wires: [] }
    const result = check('weather-station', wrongBoard)
    expect(result.complete).toBe(false)
    expect(result.requirements.find((r) => r.id === 'board')?.met).toBe(false)
  })

  it('requires TRIG and ECHO on different pins for the Parking Sensor', () => {
    const base: Circuit = {
      boardId: 'arduino-uno',
      components: [place('us1', 'hc-sr04'), place('bz1', 'buzzer')],
      wires: [
        wire('w1', { kind: 'board', pinId: '5v' }, { kind: 'component', instanceId: 'us1', terminalId: 'vcc' }),
        wire('w2', { kind: 'board', pinId: 'gnd-1' }, { kind: 'component', instanceId: 'us1', terminalId: 'gnd' }),
        wire('w3', { kind: 'board', pinId: 'd7' }, { kind: 'component', instanceId: 'us1', terminalId: 'trig' }),
        wire('w4', { kind: 'board', pinId: 'd8' }, { kind: 'component', instanceId: 'us1', terminalId: 'echo' }),
        wire('w5', { kind: 'board', pinId: 'd4' }, { kind: 'component', instanceId: 'bz1', terminalId: 'positive' }),
        wire('w6', { kind: 'component', instanceId: 'bz1', terminalId: 'negative' }, { kind: 'board', pinId: 'gnd-2' }),
      ],
    }
    expect(check('parking-sensor', base).complete).toBe(true)

    const samePins: Circuit = {
      ...base,
      wires: base.wires.map((w) =>
        w.id === 'w4' ? wire('w4', { kind: 'board', pinId: 'd7' }, { kind: 'component', instanceId: 'us1', terminalId: 'echo' }) : w,
      ),
    }
    expect(check('parking-sensor', samePins).complete).toBe(false)
  })

  it('completes the all-digital Night-Light on the Raspberry Pi', () => {
    const circuit: Circuit = {
      boardId: 'raspberry-pi-4',
      components: [place('pir1', 'pir'), place('led1', 'led'), place('r1', 'resistor-220')],
      wires: [
        wire('w1', { kind: 'board', pinId: '5v-2' }, { kind: 'component', instanceId: 'pir1', terminalId: 'vcc' }),
        wire('w2', { kind: 'board', pinId: 'gnd-6' }, { kind: 'component', instanceId: 'pir1', terminalId: 'gnd' }),
        wire('w3', { kind: 'board', pinId: 'gpio17' }, { kind: 'component', instanceId: 'pir1', terminalId: 'out' }),
        wire('w4', { kind: 'board', pinId: 'gpio23' }, { kind: 'component', instanceId: 'r1', terminalId: 'leg1' }),
        wire('w5', { kind: 'component', instanceId: 'r1', terminalId: 'leg2' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
        wire('w6', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-9' }),
      ],
    }
    expect(check('night-light-pi', circuit).complete).toBe(true)
  })
})
