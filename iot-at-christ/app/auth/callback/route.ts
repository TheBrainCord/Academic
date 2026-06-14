import { createClient } from '@/lib/supabase/server'
import { buildProfileUpsert } from '@/lib/auth/profile'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile row on first login (upsert — safe to call every time)
      // role defaults to 'student' in DB; teacher is set manually
      await supabase.from('profiles').upsert(buildProfileUpsert(data.user), { onConflict: 'id', ignoreDuplicates: false })

      // Telemetry — track sign-ins so usage can be seen on /teacher/usage.
      await supabase.from('simulator_events').insert({
        event_type: 'sign_in',
        session_id: data.user.id,
        user_id: data.user.id,
        path: '/auth/callback',
      })

      // role-based redirect is handled by /dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
