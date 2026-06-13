import { describe, it, expect } from 'vitest'
import { runSketch } from '../run-sketch'
import type { Circuit } from '../../../../types/simulator'

const place = (instanceId: string, componentId: Circuit['components'][number]['componentId'], x = 0, y = 0) => ({
  instanceId,
  componentId,
  x,
  y,
})

const wire = (id: string, from: Circuit['wires'][number]['from'], to: Circuit['wires'][number]['to']) => ({ id, from, to })

describe('runSketch — Arduino C++', () => {
  const ledCircuit: Circuit = {
    boardId: 'arduino-uno',
    components: [place('led1', 'led')],
    wires: [
      wire('w1', { kind: 'board', pinId: 'd13' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
      wire('w2', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-1' }),
    ],
  }

  it('blinks an LED on D13 and logs to Serial', () => {
    const source = `
      void setup() {
        pinMode(13, OUTPUT);
        Serial.begin(9600);
      }
      void loop() {
        digitalWrite(13, HIGH);
        Serial.println("LED on");
        delay(1000);
        digitalWrite(13, LOW);
        Serial.println("LED off");
        delay(1000);
      }
    `
    const result = runSketch(source, 'arduino-cpp', ledCircuit)
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
    expect(result.output.pinModes['d13']).toBe('OUTPUT')
    expect(result.output.serial.some((l) => l.text === 'LED on')).toBe(true)
    expect(result.output.serial.some((l) => l.text === 'LED off')).toBe(true)
    expect(typeof result.output.actuatorStates['led1']).toBe('boolean')
    expect(result.outcome?.advancedTime).toBe(true)
  })

  it('reports a syntax error with a line number', () => {
    const result = runSketch('void setup() { int x = ; }', 'arduino-cpp', ledCircuit)
    expect(result.ok).toBe(false)
    expect(result.error).not.toBeNull()
    expect(result.error?.line).toBeGreaterThan(0)
  })

  it('reports a runtime error for an unknown pin', () => {
    const source = `
      void setup() { pinMode(99, OUTPUT); }
      void loop() { delay(1000); }
    `
    const result = runSketch(source, 'arduino-cpp', ledCircuit)
    expect(result.ok).toBe(false)
    expect(result.error?.message).toContain('99')
  })

  it('errors helpfully when loop() never calls delay()', () => {
    const source = `
      void setup() {}
      void loop() { int x = 1 + 1; }
    `
    const result = runSketch(source, 'arduino-cpp', ledCircuit)
    expect(result.ok).toBe(false)
    expect(result.error?.message).toContain('delay')
  })
})

describe('runSketch — MicroPython (Raspberry Pi)', () => {
  const piCircuit: Circuit = {
    boardId: 'raspberry-pi-4',
    components: [place('led1', 'led')],
    wires: [
      wire('w1', { kind: 'board', pinId: 'gpio17' }, { kind: 'component', instanceId: 'led1', terminalId: 'anode' }),
      wire('w2', { kind: 'component', instanceId: 'led1', terminalId: 'cathode' }, { kind: 'board', pinId: 'gnd-9' }),
    ],
  }

  it('blinks an LED on GPIO17 and prints with print()', () => {
    const source = `
import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)

while True:
    GPIO.output(17, GPIO.HIGH)
    print("LED on")
    time.sleep(1)
    GPIO.output(17, GPIO.LOW)
    print("LED off")
    time.sleep(1)
`
    const result = runSketch(source, 'micropython', piCircuit)
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
    expect(result.output.pinModes['gpio17']).toBe('OUT')
    expect(result.output.serial.some((l) => l.text === 'LED on')).toBe(true)
    expect(result.output.serial.some((l) => l.text === 'LED off')).toBe(true)
    expect(typeof result.output.actuatorStates['led1']).toBe('boolean')
  })

  it('rejects analogRead-equivalent on the Pi (no ADC)', () => {
    const source = `
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
while True:
    value = analogRead(0)
`
    const result = runSketch(source, 'micropython', piCircuit)
    expect(result.ok).toBe(false)
  })
})

describe('runSketch — DHT11 sensor readings', () => {
  const sensorCircuit: Circuit = {
    boardId: 'arduino-uno',
    components: [place('dht1', 'dht11')],
    wires: [
      wire('w1', { kind: 'board', pinId: 'd2' }, { kind: 'component', instanceId: 'dht1', terminalId: 'data' }),
      wire('w2', { kind: 'component', instanceId: 'dht1', terminalId: 'vcc' }, { kind: 'board', pinId: '5v' }),
      wire('w3', { kind: 'component', instanceId: 'dht1', terminalId: 'gnd' }, { kind: 'board', pinId: 'gnd-1' }),
    ],
  }

  it('reads a digital sensor and records its reading', () => {
    const source = `
      void setup() {
        pinMode(2, INPUT);
        Serial.begin(9600);
      }
      void loop() {
        int v = digitalRead(2);
        Serial.println(v);
        delay(1000);
      }
    `
    const result = runSketch(source, 'arduino-cpp', sensorCircuit)
    expect(result.error).toBeNull()
    expect(result.ok).toBe(true)
    const keys = Object.keys(result.output.readings)
    expect(keys.some((k) => k.startsWith('dht1:'))).toBe(true)
  })
})
