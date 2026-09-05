import { describe, expect, it } from 'vitest'
import { UNIT4_DECKS } from './unit4'

describe('Unit 4 teaching decks', () => {
  it('covers the three official Unit 4 sessions', () => {
    expect(UNIT4_DECKS.map((deck) => deck.session)).toEqual([12, 13, 14])
    expect(UNIT4_DECKS.every((deck) => deck.unit === 4)).toBe(true)
  })

  it('provides an exact 60-minute slide plan for every session', () => {
    for (const deck of UNIT4_DECKS) {
      expect(deck.minutes).toBe(60)
      expect(deck.slides.reduce((total, slide) => total + slide.durationMinutes, 0)).toBe(60)
    }
  })

  it('keeps route and slide identifiers unique', () => {
    const deckIds = UNIT4_DECKS.map((deck) => deck.id)
    const slideIds = UNIT4_DECKS.flatMap((deck) => deck.slides.map((slide) => slide.id))

    expect(new Set(deckIds).size).toBe(deckIds.length)
    expect(new Set(slideIds).size).toBe(slideIds.length)
  })

  it('includes interaction, a practical build and an exit activity in every deck', () => {
    for (const deck of UNIT4_DECKS) {
      expect(deck.slides.some((slide) => slide.poll || slide.questions)).toBe(true)
      expect(deck.slides.some((slide) => slide.build)).toBe(true)
      expect(deck.slides.at(-1)?.kind).toBe('exit')
    }
  })
})
