import type { ComponentDef, ComponentId } from '@/types/simulator'

export const COMPONENTS: Record<ComponentId, ComponentDef> = {
  led: {
    id: 'led',
    name: 'LED',
    category: 'actuator',
    terminals: [
      { id: 'anode', label: 'Anode (+)', role: 'digital-in' },
      { id: 'cathode', label: 'Cathode (-)', role: 'gnd' },
    ],
    minVoltage: 1.8,
    maxVoltage: 3.3,
    requiresSeriesResistor: true,
    description:
      'A light-emitting diode. The long leg (anode) goes towards the signal, the short leg (cathode) to GND. Always add a series resistor or it will burn out.',
    glyph: 'LED',
  },
  'resistor-220': {
    id: 'resistor-220',
    name: '220Ω Resistor',
    category: 'passive',
    terminals: [
      { id: 'leg1', label: 'Leg 1', role: 'passive' },
      { id: 'leg2', label: 'Leg 2', role: 'passive' },
    ],
    minVoltage: 0,
    maxVoltage: 250,
    description:
      'Limits current. Wire it in series with an LED to keep the LED alive — either leg can face either way.',
    glyph: 'R',
  },
  'push-button': {
    id: 'push-button',
    name: 'Push Button',
    category: 'input',
    terminals: [
      { id: 'pin1', label: 'Signal', role: 'digital-out' },
      { id: 'pin2', label: 'GND', role: 'gnd' },
    ],
    minVoltage: 0,
    maxVoltage: 12,
    description:
      'A momentary switch. Wire Signal to a GPIO pin and the other leg to GND, then enable the internal pull-up (INPUT_PULLUP) so the pin reads HIGH until pressed.',
    glyph: 'BTN',
  },
  buzzer: {
    id: 'buzzer',
    name: 'Buzzer',
    category: 'actuator',
    terminals: [
      { id: 'positive', label: '+', role: 'digital-in' },
      { id: 'negative', label: '-', role: 'gnd' },
    ],
    minVoltage: 3,
    maxVoltage: 5,
    description:
      'An active buzzer that beeps when its + pin is driven HIGH. On a PWM pin you can soften the volume.',
    glyph: 'BZ',
  },
  dht11: {
    id: 'dht11',
    name: 'DHT11',
    category: 'sensor',
    terminals: [
      { id: 'vcc', label: 'VCC', role: 'vcc' },
      { id: 'data', label: 'DATA', role: 'digital-out' },
      { id: 'gnd', label: 'GND', role: 'gnd' },
    ],
    minVoltage: 3,
    maxVoltage: 5.5,
    description:
      'A basic temperature and humidity sensor. It talks over a single digital data pin — slow but very beginner-friendly.',
    readings: [
      { label: 'Temperature', unit: '°C', min: 18, max: 34 },
      { label: 'Humidity', unit: '%', min: 35, max: 85 },
    ],
    glyph: 'T°',
  },
  'hc-sr04': {
    id: 'hc-sr04',
    name: 'HC-SR04 Ultrasonic',
    category: 'sensor',
    terminals: [
      { id: 'vcc', label: 'VCC', role: 'vcc' },
      { id: 'trig', label: 'TRIG', role: 'digital-in' },
      { id: 'echo', label: 'ECHO', role: 'digital-out' },
      { id: 'gnd', label: 'GND', role: 'gnd' },
    ],
    minVoltage: 4.5,
    maxVoltage: 5.5,
    description:
      'Measures distance by timing an ultrasonic ping. TRIG listens for a pulse from the board; ECHO answers back. It really wants 5V power.',
    readings: [{ label: 'Distance', unit: 'cm', min: 2, max: 300 }],
    glyph: 'US',
  },
  ldr: {
    id: 'ldr',
    name: 'LDR (Light Sensor)',
    category: 'sensor',
    terminals: [
      { id: 'leg1', label: 'Leg 1 (VCC)', role: 'vcc' },
      { id: 'leg2', label: 'Leg 2 (signal)', role: 'analog-out' },
    ],
    minVoltage: 0,
    maxVoltage: 5,
    description:
      'A light-dependent resistor. We model it pre-wired as a voltage divider, so leg 1 takes power and leg 2 outputs an analog level — brighter light, higher reading.',
    readings: [{ label: 'Light', unit: 'raw', min: 50, max: 950 }],
    glyph: 'LDR',
  },
  pir: {
    id: 'pir',
    name: 'PIR Motion Sensor',
    category: 'sensor',
    terminals: [
      { id: 'vcc', label: 'VCC', role: 'vcc' },
      { id: 'out', label: 'OUT', role: 'digital-out' },
      { id: 'gnd', label: 'GND', role: 'gnd' },
    ],
    minVoltage: 4.5,
    maxVoltage: 12,
    description:
      'Detects movement from body heat. OUT snaps HIGH when something warm moves in front of it, then drops back after a few seconds.',
    readings: [{ label: 'Motion', unit: '', min: 0, max: 1 }],
    glyph: 'PIR',
  },
  potentiometer: {
    id: 'potentiometer',
    name: 'Potentiometer',
    category: 'input',
    terminals: [
      { id: 'vcc', label: 'VCC', role: 'vcc' },
      { id: 'wiper', label: 'Wiper', role: 'analog-out' },
      { id: 'gnd', label: 'GND', role: 'gnd' },
    ],
    minVoltage: 0,
    maxVoltage: 5,
    description:
      'A twistable knob. The middle pin (wiper) outputs a voltage between GND and VCC depending on its position — a perfect first analog input.',
    readings: [{ label: 'Position', unit: 'raw', min: 0, max: 1023 }],
    glyph: 'POT',
  },
  'soil-moisture': {
    id: 'soil-moisture',
    name: 'Soil Moisture Sensor',
    category: 'sensor',
    terminals: [
      { id: 'vcc', label: 'VCC', role: 'vcc' },
      { id: 'aout', label: 'AOUT', role: 'analog-out' },
      { id: 'gnd', label: 'GND', role: 'gnd' },
    ],
    minVoltage: 3.3,
    maxVoltage: 5,
    description:
      'Two probes that measure how wet the soil is. AOUT gives an analog level — the heart of every plant-watering project.',
    readings: [{ label: 'Moisture', unit: '%', min: 10, max: 90 }],
    glyph: 'SM',
  },
}

export function getComponent(id: ComponentId): ComponentDef {
  return COMPONENTS[id]
}
