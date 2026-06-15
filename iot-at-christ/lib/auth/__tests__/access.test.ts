import { describe, it, expect } from 'vitest'
import {
  ADMIN_EMAIL,
  canTogglePreviewRole,
  dashboardForRole,
  isAllowedSignupEmail,
  isPathAllowedForRole,
  isProtectedPath,
  isPublicPath,
  roleForNewProfile,
  togglePreviewRole,
} from '../access'

describe('isPublicPath', () => {
  it('allows the signin flow itself', () => {
    expect(isPublicPath('/auth/login')).toBe(true)
    expect(isPublicPath('/auth/callback')).toBe(true)
  })

  it('allows the Virtual Lab, lectures and idea bank without login', () => {
    expect(isPublicPath('/lab')).toBe(true)
    expect(isPublicPath('/lab/anything')).toBe(true)
    expect(isPublicPath('/learn/unit-1')).toBe(true)
    expect(isPublicPath('/ideas')).toBe(true)
  })

  it('does not match unrelated paths that merely start with the same prefix', () => {
    expect(isPublicPath('/labyrinth')).toBe(false)
    expect(isPublicPath('/learning-extra')).toBe(false)
  })

  it('rejects role dashboards', () => {
    expect(isPublicPath('/student/dashboard')).toBe(false)
    expect(isPublicPath('/teacher/dashboard')).toBe(false)
  })
})

describe('isProtectedPath', () => {
  it('protects /dashboard and role-prefixed routes', () => {
    expect(isProtectedPath('/dashboard')).toBe(true)
    expect(isProtectedPath('/teacher/dashboard')).toBe(true)
    expect(isProtectedPath('/student/simulator')).toBe(true)
    expect(isProtectedPath('/coordinator/projects')).toBe(true)
    expect(isProtectedPath('/supervisor/onboarding')).toBe(true)
  })

  it('leaves public/marketing routes unprotected', () => {
    expect(isProtectedPath('/')).toBe(false)
    expect(isProtectedPath('/lab')).toBe(false)
    expect(isProtectedPath('/auth/login')).toBe(false)
  })
})

describe('dashboardForRole', () => {
  it('maps each known role to its home dashboard', () => {
    expect(dashboardForRole('teacher')).toBe('/teacher/dashboard')
    expect(dashboardForRole('student')).toBe('/student/dashboard')
    expect(dashboardForRole('supervisor')).toBe('/supervisor/dashboard')
    expect(dashboardForRole('coordinator')).toBe('/coordinator/dashboard')
  })

  it('falls back to login for an unknown or missing role', () => {
    expect(dashboardForRole(undefined)).toBe('/auth/login')
    expect(dashboardForRole('admin')).toBe('/auth/login')
  })
})

describe('isPathAllowedForRole', () => {
  it('lets each role into its own area', () => {
    expect(isPathAllowedForRole('teacher', '/teacher/students')).toBe(true)
    expect(isPathAllowedForRole('student', '/student/simulator')).toBe(true)
    expect(isPathAllowedForRole('supervisor', '/supervisor/projects')).toBe(true)
  })

  it('lets coordinators view supervisor pages too', () => {
    expect(isPathAllowedForRole('coordinator', '/coordinator/dashboard')).toBe(true)
    expect(isPathAllowedForRole('coordinator', '/supervisor/projects')).toBe(true)
  })

  it('blocks a role from another role\'s area', () => {
    expect(isPathAllowedForRole('student', '/teacher/dashboard')).toBe(false)
    expect(isPathAllowedForRole('supervisor', '/coordinator/dashboard')).toBe(false)
    expect(isPathAllowedForRole('teacher', '/student/simulator')).toBe(false)
  })

  it('denies an unknown role everywhere', () => {
    expect(isPathAllowedForRole(undefined, '/teacher/dashboard')).toBe(false)
    expect(isPathAllowedForRole('bogus', '/student/dashboard')).toBe(false)
  })
})

describe('isAllowedSignupEmail', () => {
  it('allows Christ University accounts', () => {
    expect(isAllowedSignupEmail('jane.doe@christuniversity.com')).toBe(true)
    expect(isAllowedSignupEmail('student@christ.com')).toBe(true)
    expect(isAllowedSignupEmail('Student@ChristUniversity.COM')).toBe(true)
  })

  it('allows the admin account regardless of domain', () => {
    expect(isAllowedSignupEmail(ADMIN_EMAIL)).toBe(true)
    expect(isAllowedSignupEmail('Ravesh.Ashok.Naik@gmail.com')).toBe(true)
  })

  it('rejects other domains, including lookalikes', () => {
    expect(isAllowedSignupEmail('student@gmail.com')).toBe(false)
    expect(isAllowedSignupEmail('student@christuniversity.in')).toBe(false)
    expect(isAllowedSignupEmail('student@notchrist.com')).toBe(false)
    expect(isAllowedSignupEmail('student@christ.org')).toBe(false)
  })

  it('rejects missing emails', () => {
    expect(isAllowedSignupEmail(undefined)).toBe(false)
    expect(isAllowedSignupEmail(null)).toBe(false)
    expect(isAllowedSignupEmail('')).toBe(false)
  })
})

describe('roleForNewProfile', () => {
  it('makes the admin account a teacher on first sign-in', () => {
    expect(roleForNewProfile(ADMIN_EMAIL)).toBe('teacher')
    expect(roleForNewProfile('Ravesh.Ashok.Naik@gmail.com')).toBe('teacher')
  })

  it('defaults everyone else to student', () => {
    expect(roleForNewProfile('jane.doe@christuniversity.com')).toBe('student')
  })
})

describe('canTogglePreviewRole', () => {
  it('allows only the admin account', () => {
    expect(canTogglePreviewRole(ADMIN_EMAIL)).toBe(true)
    expect(canTogglePreviewRole('Ravesh.Ashok.Naik@gmail.com')).toBe(true)
  })

  it('rejects everyone else', () => {
    expect(canTogglePreviewRole('jane.doe@christuniversity.com')).toBe(false)
    expect(canTogglePreviewRole(undefined)).toBe(false)
    expect(canTogglePreviewRole(null)).toBe(false)
  })
})

describe('togglePreviewRole', () => {
  it('switches teacher to student and back', () => {
    expect(togglePreviewRole('teacher')).toBe('student')
    expect(togglePreviewRole('student')).toBe('teacher')
  })

  it('defaults to teacher when the current role is missing', () => {
    expect(togglePreviewRole(undefined)).toBe('teacher')
  })
})
