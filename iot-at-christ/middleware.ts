import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/callback', '/research/published']

// Map each role to its home dashboard
const ROLE_DASHBOARD: Record<string, string> = {
  teacher:     '/teacher/dashboard',
  student:     '/student/dashboard',
  supervisor:  '/supervisor/dashboard',
  coordinator: '/coordinator/dashboard',
}

// Paths each role is allowed to access (prefix match)
const ROLE_PREFIXES: Record<string, string[]> = {
  teacher:     ['/teacher'],
  student:     ['/student'],
  supervisor:  ['/supervisor'],
  coordinator: ['/coordinator', '/supervisor'],  // coordinators can view supervisor pages too
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const path = request.nextUrl.pathname

  // A deploy without Supabase env vars must not 500 on every request
  // (MIDDLEWARE_INVOCATION_FAILED) — route to the static setup notice instead.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (path === '/setup') return NextResponse.next()
    return NextResponse.redirect(new URL('/setup', request.url))
  }
  if (path === '/setup') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components to read auth state.
  // Never let an unreachable/misconfigured Supabase take the whole site down:
  // on failure, treat the request as unauthenticated instead of throwing.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  // Allow public paths through without auth
  if (PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'))) {
    return supabaseResponse
  }

  // Root redirect
  if (path === '/') {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
    // Role-based home redirect handled below
  }

  // Protect all role-prefixed routes
  const isProtected = Object.values(ROLE_PREFIXES)
    .flat()
    .some(prefix => path.startsWith(prefix))

  if (isProtected || path === '/dashboard') {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role as string | undefined

    if (!role) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // /dashboard → redirect to role-specific home
    if (path === '/dashboard') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[role] ?? '/auth/login', request.url))
    }

    // Check that the role is allowed to access this path prefix
    const allowedPrefixes = ROLE_PREFIXES[role] ?? []
    const isAllowed = allowedPrefixes.some(prefix => path.startsWith(prefix))

    if (!isAllowed) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[role] ?? '/auth/login', request.url))
    }

    // New supervisor with no onboarding → redirect to onboarding
    if (role === 'supervisor' && !path.startsWith('/supervisor/onboarding')) {
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('bio_short')
        .eq('id', user.id)
        .single()
      if (!fullProfile?.bio_short) {
        return NextResponse.redirect(new URL('/supervisor/onboarding', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
