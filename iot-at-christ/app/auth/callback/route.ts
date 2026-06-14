import { createClient } from '@/lib/supabase/server'
import { buildProfileUpsert } from '@/lib/auth/profile'
import { isAllowedSignupEmail, roleForNewProfile } from '@/lib/auth/access'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()

      // First-time sign-in: only Christ University accounts (and the admin
      // account) may register. Reject and sign out everyone else.
      if (!existingProfile && !isAllowedSignupEmail(data.user.email)) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/auth/login?error=domain_not_allowed`)
      }

      // Create profile row on first login (upsert — safe to call every time).
      // Role is only set for brand-new profiles; returning users keep their
      // existing role (e.g. a teacher-promoted student).
      const role = existingProfile ? undefined : roleForNewProfile(data.user.email)
      await supabase.from('profiles').upsert(
        buildProfileUpsert(data.user, role),
        { onConflict: 'id', ignoreDuplicates: false }
      )

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
