import { describe, expect, it } from 'vitest'
import { COURSE_STUDIO_DURATION_MINUTES, WEEKLY_PLANS } from './weekly-plan'

describe('Course Studio weekly plan', () => {
  it('has unique route and nested schedule identifiers', () => {
    expect(new Set(WEEKLY_PLANS.map(({ id }) => id)).size).toBe(WEEKLY_PLANS.length)
    const scheduleIds = WEEKLY_PLANS.flatMap(({ schedule }) => schedule.map(({ id }) => id))
    expect(new Set(scheduleIds).size).toBe(scheduleIds.length)
  })

  it('keeps every weekly duration equal to its schedule', () => {
    for (const plan of WEEKLY_PLANS) {
      expect(plan.schedule.reduce((total, item) => total + item.durationMinutes, 0)).toBe(plan.durationMinutes)
    }
    expect(COURSE_STUDIO_DURATION_MINUTES).toBe(WEEKLY_PLANS.reduce((total, plan) => total + plan.durationMinutes, 0))
  })

  it('provides valid quiz answer indices', () => {
    for (const question of WEEKLY_PLANS.flatMap(({ quiz }) => quiz)) {
      expect(question.options.length).toBeGreaterThan(1)
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0)
      expect(question.correctAnswer).toBeLessThan(question.options.length)
      expect(question.explanation.trim()).not.toBe('')
    }
  })

  it('requires complete preparation and exam fields', () => {
    for (const plan of WEEKLY_PLANS) {
      expect(plan.preparation.student.length).toBeGreaterThan(0)
      expect(plan.preparation.teacher.length).toBeGreaterThan(0)
      expect(plan.preparation.equipment.length).toBeGreaterThan(0)
      expect(plan.exam.instructions.trim()).not.toBe('')
      expect(plan.exam.criteria.length).toBeGreaterThan(0)
      expect(plan.exam.durationMinutes).toBeGreaterThan(0)
      expect(plan.exam.passingPercentage).toBeGreaterThan(0)
    }
  })
})
