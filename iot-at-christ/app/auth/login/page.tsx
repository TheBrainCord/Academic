import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginButton } from './LoginButton'

export default async function LoginPage() {
  // If already authenticated, skip straight to role-based redirect
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

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

        <p className="text-xs text-christ-navy/40">
          Use your Christ University Google account
        </p>
      </div>
    </main>
  )
}
