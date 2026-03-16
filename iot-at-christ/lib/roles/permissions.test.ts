import { describe, it, expect } from 'vitest'
import {
  canSignOffPhase,
  canReadPrivateComments,
  canAssignSupervisor,
  canReadPhase,
  canReadSection,
  canPublishPaper,
  canAnswerQuestion,
  buildSupervisorContext,
} from './permissions'
import type { PermissionContext } from '@/types/roles'

// ── Helpers ──────────────────────────────────────────────────────────────────

function ctx(overrides: Partial<PermissionContext>): PermissionContext {
  return {
    userId:   'test-user',
    role:     'student',
    subtype:  null,
    ...overrides,
  }
}

// ── canSignOffPhase ───────────────────────────────────────────────────────────

describe('canSignOffPhase', () => {
  it('allows coordinator', () => {
    expect(canSignOffPhase(ctx({ role: 'coordinator' }))).toBe(true)
  })
  it('allows teacher', () => {
    expect(canSignOffPhase(ctx({ role: 'teacher' }))).toBe(true)
  })
  it('allows primary supervisor', () => {
    expect(canSignOffPhase(ctx({ role: 'supervisor', supervisorType: 'primary' }))).toBe(true)
  })
  it('denies advisor supervisor', () => {
    expect(canSignOffPhase(ctx({ role: 'supervisor', supervisorType: 'advisor' }))).toBe(false)
  })
  it('denies student', () => {
    expect(canSignOffPhase(ctx({ role: 'student' }))).toBe(false)
  })
})

// ── canReadPrivateComments ────────────────────────────────────────────────────

describe('canReadPrivateComments', () => {
  it('allows supervisor', () => {
    expect(canReadPrivateComments(ctx({ role: 'supervisor' }))).toBe(true)
  })
  it('allows coordinator', () => {
    expect(canReadPrivateComments(ctx({ role: 'coordinator' }))).toBe(true)
  })
  it('denies student', () => {
    expect(canReadPrivateComments(ctx({ role: 'student' }))).toBe(false)
  })
})

// ── canAssignSupervisor ───────────────────────────────────────────────────────

describe('canAssignSupervisor', () => {
  it('allows coordinator', () => {
    expect(canAssignSupervisor(ctx({ role: 'coordinator' }))).toBe(true)
  })
  it('allows teacher', () => {
    expect(canAssignSupervisor(ctx({ role: 'teacher' }))).toBe(true)
  })
  it('denies supervisor', () => {
    expect(canAssignSupervisor(ctx({ role: 'supervisor' }))).toBe(false)
  })
})

// ── canReadPhase ──────────────────────────────────────────────────────────────

describe('canReadPhase', () => {
  it('coordinator reads any phase', () => {
    expect(canReadPhase(ctx({ role: 'coordinator' }), 99)).toBe(true)
  })
  it('primary supervisor reads any phase', () => {
    expect(canReadPhase(ctx({ role: 'supervisor', supervisorType: 'primary' }), 3)).toBe(true)
  })
  it('advisor reads only tagged phases', () => {
    const c = ctx({ role: 'supervisor', supervisorType: 'advisor', taggedPhases: [1, 2] })
    expect(canReadPhase(c, 1)).toBe(true)
    expect(canReadPhase(c, 3)).toBe(false)
  })
  it('student reads their own project phases (always true, RLS scopes)', () => {
    expect(canReadPhase(ctx({ role: 'student' }), 1)).toBe(true)
  })
})

// ── canReadSection ────────────────────────────────────────────────────────────

describe('canReadSection', () => {
  it('advisor reads only tagged sections', () => {
    const c = ctx({ role: 'supervisor', supervisorType: 'advisor', taggedSections: ['methodology', 'results'] })
    expect(canReadSection(c, 'methodology')).toBe(true)
    expect(canReadSection(c, 'introduction')).toBe(false)
  })
})

// ── canPublishPaper ───────────────────────────────────────────────────────────

describe('canPublishPaper', () => {
  it('allows coordinator', () => expect(canPublishPaper(ctx({ role: 'coordinator' }))).toBe(true))
  it('denies student',     () => expect(canPublishPaper(ctx({ role: 'student' }))).toBe(false))
  it('denies supervisor',  () => expect(canPublishPaper(ctx({ role: 'supervisor' }))).toBe(false))
})

// ── canAnswerQuestion ─────────────────────────────────────────────────────────

describe('canAnswerQuestion', () => {
  it('allows supervisor',   () => expect(canAnswerQuestion(ctx({ role: 'supervisor' }))).toBe(true))
  it('allows coordinator',  () => expect(canAnswerQuestion(ctx({ role: 'coordinator' }))).toBe(true))
  it('denies student',      () => expect(canAnswerQuestion(ctx({ role: 'student' }))).toBe(false))
})

// ── buildSupervisorContext ────────────────────────────────────────────────────

describe('buildSupervisorContext', () => {
  it('builds context from project_supervisors row', () => {
    const c = buildSupervisorContext('uid', 'supervisor', 'primary', {
      supervisor_type: 'advisor',
      tagged_phases:   [1, 2],
      tagged_sections: ['methodology'],
      project_id:      'proj-1',
    })
    expect(c.supervisorType).toBe('advisor')
    expect(c.taggedPhases).toEqual([1, 2])
    expect(c.projectId).toBe('proj-1')
  })

  it('handles null project_supervisors row (coordinator view)', () => {
    const c = buildSupervisorContext('uid', 'coordinator', null, null)
    expect(c.taggedPhases).toEqual([])
    expect(c.supervisorType).toBeUndefined()
  })
})
