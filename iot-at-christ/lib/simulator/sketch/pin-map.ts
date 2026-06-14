// Translates the pin numbers/names a student writes in code (13, A0, 4...)
// into the PinDef ids used by the circuit/validation engine ('d13', 'a0',
// 'gpio4'...). Keeps the sketch runtime decoupled from board-specific ids.

import type { BoardDef, BoardId } from '@/types/simulator'
import type { RuntimeValue } from './interpreter'

export function resolvePinId(board: BoardDef, value: RuntimeValue): string | null {
  const pinIds = new Set(board.pins.map((p) => p.id))

  if (typeof value === 'number') {
    const n = Math.round(value)
    const candidates: Record<BoardId, string> = {
      'arduino-uno': `d${n}`,
      'esp32-devkit': `gpio${n}`,
      'raspberry-pi-4': `gpio${n}`,
      'nodemcu-esp8266': `d${n}`,
    }
    const candidate = candidates[board.id]
    return pinIds.has(candidate) ? candidate : null
  }

  if (typeof value === 'string') {
    // Arduino analog pin constants: A0-A5 -> 'a0'-'a5' (Uno only).
    const match = /^A([0-9]+)$/i.exec(value)
    if (match) {
      const candidate = `a${match[1]}`
      return pinIds.has(candidate) ? candidate : null
    }
    const lower = value.toLowerCase()
    return pinIds.has(lower) ? lower : null
  }

  return null
}

/** Human-readable hint for "unknown pin" errors. */
export function pinHint(board: BoardDef): string {
  switch (board.id) {
    case 'arduino-uno':
      return 'Use pin numbers 0-13 for digital pins, or A0-A5 for analog pins.'
    case 'esp32-devkit':
      return 'Use the GPIO number, e.g. pinMode(4, OUTPUT) for GPIO4.'
    case 'raspberry-pi-4':
      return 'Use the BCM GPIO number, e.g. GPIO.setup(17, GPIO.OUT) for GPIO17.'
    case 'nodemcu-esp8266':
      return 'Use the silkscreen D-number, e.g. digitalWrite(D1, HIGH) or pinMode(2, OUTPUT) for D2. A0 is the analog pin.'
  }
}
