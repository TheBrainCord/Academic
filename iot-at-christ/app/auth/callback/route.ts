import { createClient } from '@/lib/supabase/server'
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
      const googleIdentity = data.user.identities?.find(i => i.provider === 'google')
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata.full_name,
        avatar_url: data.user.user_metadata.avatar_url,
        google_id: googleIdentity?.id,
        // role defaults to 'student' in DB; teacher is set manually
      }, { onConflict: 'id', ignoreDuplicates: false })

      // role-based redirect is handled by /dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
