import type { ReactNode } from 'react'
import Link from 'next/link'

// Public shell — deliberately no Supabase calls, so these pages work even
// before auth/env is configured and for visitors who never sign in.
const navItems = [
  { href: '/',      label: 'Home' },
  { href: '/lab',   label: 'Virtual Lab' },
  { href: '/ideas', label: 'Idea Bank' },
]

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-christ-bg">
      <nav className="border-b border-christ-navy/10 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="font-display font-bold text-christ-navy text-sm">
            IoT at CHRIST
          </Link>
          <div className="flex items-center gap-4">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-body text-christ-navy/60 hover:text-christ-saffron transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/auth/login"
              className="text-xs font-body font-semibold text-white bg-christ-saffron rounded-full px-3 py-1.5 hover:bg-christ-saffron/90 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      <footer className="max-w-5xl mx-auto px-4 py-6 text-[11px] font-body text-christ-navy/40">
        Open-source IoT education platform · Christ University Bengaluru · Sign in to track XP,
        submit assignments and join the Research Lab.
      </footer>
    </div>
  )
}
