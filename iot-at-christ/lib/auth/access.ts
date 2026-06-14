// Pure routing/access-control rules used by middleware.ts to gate the
// signin flow and role-based dashboards. Kept dependency-free (no Next.js
// or Supabase imports) so the rules can be unit tested without a server.

export type UserRole = 'teacher' | 'student' | 'supervisor' | 'coordinator'

// Public paths that don't require authentication — the Virtual Lab, Lecture
// Modules and Idea Bank are open to everyone so teaching sessions don't
// depend on login.
export const PUBLIC_PATHS = ['/auth/login', '/auth/callback', '/research/published', '/lab', '/learn', '/ideas']

// Map each role to its home dashboard
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  teacher:     '/teacher/dashboard',
  student:     '/student/dashboard',
  supervisor:  '/supervisor/dashboard',
  coordinator: '/coordinator/dashboard',
}

// Paths each role is allowed to access (prefix match)
export const ROLE_PREFIXES: Record<UserRole, string[]> = {
  teacher:     ['/teacher'],
  student:     ['/student'],
  supervisor:  ['/supervisor'],
  coordinator: ['/coordinator', '/supervisor'],  // coordinators can view supervisor pages too
}

const ALL_ROLE_PREFIXES = Object.values(ROLE_PREFIXES).flat()

/** Paths reachable without signing in (exact match or sub-path). */
export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))
}

/** True if a path falls under any role's protected prefixes, or is /dashboard. */
export function isProtectedPath(path: string): boolean {
  return path === '/dashboard' || ALL_ROLE_PREFIXES.some(prefix => path.startsWith(prefix))
}

/** Home dashboard for a role, falling back to login when the role is unknown. */
export function dashboardForRole(role: string | undefined): string {
  return ROLE_DASHBOARD[role as UserRole] ?? '/auth/login'
}

/** True if the given role may access the given path prefix. */
export function isPathAllowedForRole(role: string | undefined, path: string): boolean {
  const prefixes = ROLE_PREFIXES[role as UserRole] ?? []
  return prefixes.some(prefix => path.startsWith(prefix))
}
