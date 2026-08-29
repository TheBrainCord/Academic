import { describe, expect, it } from 'vitest'
import { BOARDS } from '../boards'

describe('board pin schema', () => {
  it('models every general-purpose digital pin without the ambiguous legacy capability', () => {
    for (const board of Object.values(BOARDS)) {
      for (const pin of board.pins) {
        expect(pin.capabilities).not.toContain('digital')
      }
    }
  })

  it('models ESP32 GPIO34 and GPIO35 as analog-capable inputs only', () => {
    const pins = BOARDS['esp32-devkit'].pins
    for (const id of ['gpio34', 'gpio35']) {
      const pin = pins.find((candidate) => candidate.id === id)
      expect(pin?.capabilities).toEqual(['digital-input', 'analog-in'])
      expect(pin?.capabilities).not.toContain('gpio')
      expect(pin?.capabilities).not.toContain('pwm')
    }
  })

  it('marks exposed ESP32 strapping pins with cautions while retaining their GPIO capabilities', () => {
    const pins = BOARDS['esp32-devkit'].pins
    for (const id of ['gpio2', 'gpio4', 'gpio12', 'gpio15']) {
      const pin = pins.find((candidate) => candidate.id === id)
      expect(pin?.capabilities).toContain('gpio')
      expect(pin?.warnings?.join(' ')).toMatch(/boot|reset/i)
    }
    expect(pins.find((pin) => pin.id === 'gpio23')?.warnings).toBeUndefined()
  })
})
