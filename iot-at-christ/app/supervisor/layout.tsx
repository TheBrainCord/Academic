import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['supervisor', 'coordinator', 'teacher'].includes(profile.role)) {
    redirect('/auth/login')
  }

  const nav = [
    { href: '/supervisor/dashboard', label: 'Dashboard' },
    { href: '/supervisor/onboarding', label: 'My Profile' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-christ-navy text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">IoT at CHRIST</p>
          <p className="font-semibold text-sm">Supervisor Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 text-xs text-white/50">
          {profile.full_name ?? user.email}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
