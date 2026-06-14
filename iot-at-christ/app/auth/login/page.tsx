import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginButton } from './LoginButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  // If already authenticated, skip straight to role-based redirect
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const error = searchParams.error

  return (
    <main className="min-h-screen bg-christ-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Christ University branding */}
        <div>
          <p className="text-sm font-mono text-christ-saffron uppercase tracking-widest">
            Christ University · Bengaluru
          </p>
          <h1 className="mt-2 text-4xl font-display font-bold text-christ-navy">
            IoT at CHRIST
          </h1>
          <p className="mt-2 text-body text-christ-navy/60">
            M.Tech CSE · Semester 2 · 2025–26
          </p>
        </div>

        <LoginButton />

        {error === 'domain_not_allowed' && (
          <p className="text-sm font-body text-christ-red">
            Sign-in is restricted to Christ University Google accounts (@christ&hellip;.com).
          </p>
        )}
        {error === 'auth_failed' && (
          <p className="text-sm font-body text-christ-red">
            Sign-in failed. Please try again.
          </p>
        )}
        {error === 'no_profile' && (
          <p className="text-sm font-body text-christ-red">
            Your previous sign-in didn&apos;t finish setting up your account. Please sign in again.
          </p>
        )}

        <p className="text-xs text-christ-navy/40">
          Use your Christ University Google account
        </p>
      </div>
    </main>
  )
}
