import type { BoardDef, BoardId, PinDef } from '@/types/simulator'

// Pin lists are deliberately a teachable subset, not the full headers —
// enough to wire every component in the palette without overwhelming students.

const ARDUINO_UNO_PINS: PinDef[] = [
  { id: '5v', label: '5V', capabilities: ['power-5v'], side: 'left', index: 0 },
  { id: '3v3', label: '3.3V', capabilities: ['power-3v3'], side: 'left', index: 1 },
  { id: 'gnd-1', label: 'GND', capabilities: ['ground'], side: 'left', index: 2 },
  { id: 'gnd-2', label: 'GND', capabilities: ['ground'], side: 'left', index: 3 },
  { id: 'a0', label: 'A0', capabilities: ['analog-in'], side: 'left', index: 4 },
  { id: 'a1', label: 'A1', capabilities: ['analog-in'], side: 'left', index: 5 },
  { id: 'a2', label: 'A2', capabilities: ['analog-in'], side: 'left', index: 6 },
  { id: 'a3', label: 'A3', capabilities: ['analog-in'], side: 'left', index: 7 },
  { id: 'a4', label: 'A4', capabilities: ['analog-in', 'i2c-sda'], side: 'left', index: 8 },
  { id: 'a5', label: 'A5', capabilities: ['analog-in', 'i2c-scl'], side: 'left', index: 9 },
  { id: 'gnd-3', label: 'GND', capabilities: ['ground'], side: 'right', index: 0 },
  { id: 'd13', label: 'D13', capabilities: ['digital'], side: 'right', index: 1 },
  { id: 'd12', label: 'D12', capabilities: ['digital'], side: 'right', index: 2 },
  { id: 'd11', label: 'D11', capabilities: ['digital', 'pwm'], side: 'right', index: 3 },
  { id: 'd10', label: 'D10', capabilities: ['digital', 'pwm'], side: 'right', index: 4 },
  { id: 'd9', label: 'D9', capabilities: ['digital', 'pwm'], side: 'right', index: 5 },
  { id: 'd8', label: 'D8', capabilities: ['digital'], side: 'right', index: 6 },
  { id: 'd7', label: 'D7', capabilities: ['digital'], side: 'right', index: 7 },
  { id: 'd6', label: 'D6', capabilities: ['digital', 'pwm'], side: 'right', index: 8 },
  { id: 'd5', label: 'D5', capabilities: ['digital', 'pwm'], side: 'right', index: 9 },
  { id: 'd4', label: 'D4', capabilities: ['digital'], side: 'right', index: 10 },
  { id: 'd3', label: 'D3', capabilities: ['digital', 'pwm'], side: 'right', index: 11 },
  { id: 'd2', label: 'D2', capabilities: ['digital'], side: 'right', index: 12 },
  { id: 'd1', label: 'D1/TX', capabilities: ['digital', 'uart-tx'], side: 'right', index: 13 },
  { id: 'd0', label: 'D0/RX', capabilities: ['digital', 'uart-rx'], side: 'right', index: 14 },
]

const ESP32_DEVKIT_PINS: PinDef[] = [
  { id: '3v3', label: '3V3', capabilities: ['power-3v3'], side: 'left', index: 0 },
  { id: 'gnd-l', label: 'GND', capabilities: ['ground'], side: 'left', index: 1 },
  { id: 'gpio34', label: 'GPIO34', capabilities: ['digital', 'analog-in'], side: 'left', index: 2 },
  { id: 'gpio35', label: 'GPIO35', capabilities: ['digital', 'analog-in'], side: 'left', index: 3 },
  { id: 'gpio32', label: 'GPIO32', capabilities: ['digital', 'analog-in'], side: 'left', index: 4 },
  { id: 'gpio33', label: 'GPIO33', capabilities: ['digital', 'analog-in'], side: 'left', index: 5 },
  { id: 'gpio25', label: 'GPIO25', capabilities: ['digital', 'pwm', 'analog-in'], side: 'left', index: 6 },
  { id: 'gpio26', label: 'GPIO26', capabilities: ['digital', 'pwm', 'analog-in'], side: 'left', index: 7 },
  { id: 'gpio27', label: 'GPIO27', capabilities: ['digital', 'pwm', 'analog-in'], side: 'left', index: 8 },
  { id: 'gpio14', label: 'GPIO14', capabilities: ['digital', 'pwm'], side: 'left', index: 9 },
  { id: 'gpio12', label: 'GPIO12', capabilities: ['digital', 'pwm'], side: 'left', index: 10 },
  { id: 'gpio13', label: 'GPIO13', capabilities: ['digital', 'pwm'], side: 'left', index: 11 },
  { id: 'vin', label: 'VIN (5V)', capabilities: ['power-5v'], side: 'right', index: 0 },
  { id: 'gnd-r', label: 'GND', capabilities: ['ground'], side: 'right', index: 1 },
  { id: 'gpio23', label: 'GPIO23', capabilities: ['digital', 'pwm'], side: 'right', index: 2 },
  { id: 'gpio22', label: 'GPIO22', capabilities: ['digital', 'pwm', 'i2c-scl'], side: 'right', index: 3 },
  { id: 'gpio21', label: 'GPIO21', capabilities: ['digital', 'pwm', 'i2c-sda'], side: 'right', index: 4 },
  { id: 'gpio19', label: 'GPIO19', capabilities: ['digital', 'pwm'], side: 'right', index: 5 },
  { id: 'gpio18', label: 'GPIO18', capabilities: ['digital', 'pwm'], side: 'right', index: 6 },
  { id: 'gpio17', label: 'GPIO17/TX', capabilities: ['digital', 'uart-tx'], side: 'right', index: 7 },
  { id: 'gpio16', label: 'GPIO16/RX', capabilities: ['digital', 'uart-rx'], side: 'right', index: 8 },
  { id: 'gpio4', label: 'GPIO4', capabilities: ['digital', 'pwm'], side: 'right', index: 9 },
  { id: 'gpio2', label: 'GPIO2', capabilities: ['digital', 'pwm'], side: 'right', index: 10 },
  { id: 'gpio15', label: 'GPIO15', capabilities: ['digital', 'pwm'], side: 'right', index: 11 },
]

// Left column ≈ odd physical pins, right column ≈ even pins, like the real header.
const RASPBERRY_PI_PINS: PinDef[] = [
  { id: '3v3', label: '3V3 (pin 1)', capabilities: ['power-3v3'], side: 'left', index: 0 },
  { id: 'gpio2', label: 'GPIO2 (SDA)', capabilities: ['digital', 'i2c-sda'], side: 'left', index: 1 },
  { id: 'gpio3', label: 'GPIO3 (SCL)', capabilities: ['digital', 'i2c-scl'], side: 'left', index: 2 },
  { id: 'gpio4', label: 'GPIO4', capabilities: ['digital'], side: 'left', index: 3 },
  { id: 'gnd-9', label: 'GND (pin 9)', capabilities: ['ground'], side: 'left', index: 4 },
  { id: 'gpio17', label: 'GPIO17', capabilities: ['digital'], side: 'left', index: 5 },
  { id: 'gpio27', label: 'GPIO27', capabilities: ['digital'], side: 'left', index: 6 },
  { id: 'gpio22', label: 'GPIO22', capabilities: ['digital'], side: 'left', index: 7 },
  { id: '5v-2', label: '5V (pin 2)', capabilities: ['power-5v'], side: 'right', index: 0 },
  { id: '5v-4', label: '5V (pin 4)', capabilities: ['power-5v'], side: 'right', index: 1 },
  { id: 'gnd-6', label: 'GND (pin 6)', capabilities: ['ground'], side: 'right', index: 2 },
  { id: 'gpio14', label: 'GPIO14 (TXD)', capabilities: ['digital', 'uart-tx'], side: 'right', index: 3 },
  { id: 'gpio15', label: 'GPIO15 (RXD)', capabilities: ['digital', 'uart-rx'], side: 'right', index: 4 },
  { id: 'gpio18', label: 'GPIO18 (PWM)', capabilities: ['digital', 'pwm'], side: 'right', index: 5 },
  { id: 'gnd-14', label: 'GND (pin 14)', capabilities: ['ground'], side: 'right', index: 6 },
  { id: 'gpio23', label: 'GPIO23', capabilities: ['digital'], side: 'right', index: 7 },
  { id: 'gpio24', label: 'GPIO24', capabilities: ['digital'], side: 'right', index: 8 },
]

export const BOARDS: Record<BoardId, BoardDef> = {
  'arduino-uno': {
    id: 'arduino-uno',
    name: 'Arduino Uno',
    logicVoltage: 5,
    hasAnalogIn: true,
    pins: ARDUINO_UNO_PINS,
    description: 'The classic 5V beginner board — forgiving, well documented, and perfect for first circuits.',
    teachingNotes: [
      'The Uno runs 5V logic: its pins output 5V and expect 5V signals.',
      'A0-A5 are analog inputs that turn 0-5V into a number from 0 to 1023.',
      'Only D3, D5, D6, D9, D10 and D11 support PWM — use them to dim LEDs with analogWrite().',
      'A4 and A5 double as the I2C bus (SDA/SCL) for smart sensors and displays.',
    ],
    accentColor: '#00878F',
  },
  'esp32-devkit': {
    id: 'esp32-devkit',
    name: 'ESP32 DevKit',
    logicVoltage: 3.3,
    hasAnalogIn: true,
    pins: ESP32_DEVKIT_PINS,
    description: 'A 3.3V powerhouse with built-in Wi-Fi and Bluetooth — the go-to board for real IoT projects.',
    teachingNotes: [
      'GPIO pins are 3.3V — connecting 5V signals can damage the chip.',
      'GPIO34 and GPIO35 are input-only: great for sensors, but they cannot drive an LED.',
      'The ADC is 12-bit, so analog reads go from 0 to 4095 (the Uno only goes to 1023).',
      'Built-in Wi-Fi and Bluetooth mean your sensor data can go straight to the cloud.',
    ],
    accentColor: '#5B5B5B',
  },
  'raspberry-pi-4': {
    id: 'raspberry-pi-4',
    name: 'Raspberry Pi 4',
    logicVoltage: 3.3,
    hasAnalogIn: false,
    pins: RASPBERRY_PI_PINS,
    description: 'A full Linux computer with a 40-pin GPIO header — powerful, but with one famous catch: no analog inputs.',
    teachingNotes: [
      'No analog pins! Analog sensors need an external ADC like the MCP3008.',
      'GPIO is 3.3V and NOT 5V-tolerant — a 5V signal on a GPIO pin can kill the Pi.',
      'The Pi runs a full OS: you read pins from Python (gpiozero), not an Arduino sketch.',
      'GPIO2 and GPIO3 carry the I2C bus — the easiest way to attach digital sensors to a Pi.',
    ],
    accentColor: '#C7053D',
  },
}

export function getBoard(id: BoardId): BoardDef {
  return BOARDS[id]
}
