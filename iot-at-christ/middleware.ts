import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh session — required for Server Components to read auth state
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirect unauthenticated users away from protected routes
  if (!user && (path.startsWith('/teacher') || path.startsWith('/student'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && (path.startsWith('/teacher') || path.startsWith('/student'))) {
    // Verify role matches route — fetched via RLS-bound query
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (path.startsWith('/teacher') && role !== 'teacher') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
    if (path.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*', '/dashboard'],
}
