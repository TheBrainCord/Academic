import { describe, expect, it } from 'vitest'
import { UNIT6_DECKS } from './unit6'

describe('Unit 6 self-study deck', () => {
  it('is a single 60-minute Unit 6 learning journey', () => {
    expect(UNIT6_DECKS).toHaveLength(1)
    const deck = UNIT6_DECKS[0]
    expect(deck.unit).toBe(6)
    expect(deck.minutes).toBe(60)
    expect(deck.slides.reduce((total, slide) => total + slide.durationMinutes, 0)).toBe(60)
  })

  it('covers the requested Unit 6 topics and ends with a case study', () => {
    const deck = UNIT6_DECKS[0]
    const searchable = JSON.stringify(deck).toLowerCase()

    expect(searchable).toContain('edge computing')
    expect(searchable).toContain('cloud architecture')
    expect(searchable).toContain('tinyml')
    expect(searchable).toContain('authentication')
    expect(searchable).toContain('encryption')
    expect(searchable).toContain('tls')
    expect(searchable).toContain('dtls')
    expect(deck.slides.at(-1)?.caseStudy).toBeDefined()
  })

  it('keeps deck and slide identifiers unique', () => {
    const deckIds = UNIT6_DECKS.map((deck) => deck.id)
    const slideIds = UNIT6_DECKS.flatMap((deck) => deck.slides.map((slide) => slide.id))

    expect(new Set(deckIds).size).toBe(deckIds.length)
    expect(new Set(slideIds).size).toBe(slideIds.length)
  })

  it('provides a complete final architecture workspace', () => {
    const caseStudy = UNIT6_DECKS[0].slides.at(-1)?.caseStudy
    expect(caseStudy?.fields).toHaveLength(10)
    expect(caseStudy?.requirements.length).toBeGreaterThanOrEqual(6)
    expect(caseStudy?.reflectionQuestions.length).toBeGreaterThanOrEqual(4)
  })
})
