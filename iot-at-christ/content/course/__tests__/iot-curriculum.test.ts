import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { load } from 'js-yaml'

type Session = { hours: number }
type Unit = { hours: number; sessions: Session[] }
type IoTCurriculum = { units: Unit[] }

const curriculumPath = resolve(process.cwd(), 'content/subjects/iot.yaml')
const curriculum = load(readFileSync(curriculumPath, 'utf8')) as IoTCurriculum

describe('official IoT curriculum contact hours', () => {
  it('contains six official units totalling exactly 40 hours', () => {
    expect(curriculum.units).toHaveLength(6)
    expect(curriculum.units.map((unit) => unit.hours)).toEqual([6, 7, 7, 5, 6, 9])
    expect(curriculum.units.reduce((total, unit) => total + unit.hours, 0)).toBe(40)
  })

  it('uses positive session durations that total the declared hours for every unit', () => {
    for (const unit of curriculum.units) {
      expect(unit.sessions.length).toBeGreaterThan(0)
      expect(unit.sessions.every((session) => session.hours > 0)).toBe(true)
      expect(unit.sessions.reduce((total, session) => total + session.hours, 0)).toBe(unit.hours)
    }
  })
})
