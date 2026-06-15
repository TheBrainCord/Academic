import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { canTogglePreviewRole } from '@/lib/auth/access'
import { togglePreviewRoleAction } from '@/app/actions/preview-role'

const navItems = [
  { href: '/student/dashboard',   label: 'Home' },
  { href: '/student/missions',    label: 'Missions' },
  { href: '/student/lessons',     label: 'Lessons' },
  { href: '/student/simulator',   label: 'Virtual Lab' },
  { href: '/student/assignments', label: 'Assignments' },
  { href: '/student/forum',       label: 'Forum' },
  { href: '/student/research',    label: 'Research' },
  { href: '/student/research-ideas', label: 'Idea Bank' },
  { href: '/student/leaderboard', label: 'Leaderboard' },
]

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: progress } = await supabase
    .from('student_progress')
    .select('xp')
    .eq('student_id', user?.id ?? '')

  const totalXP = progress?.reduce((sum, r) => sum + (r.xp ?? 0), 0) ?? 0
  const canPreview = canTogglePreviewRole(user?.email)

  return (
    <div className="min-h-screen bg-christ-bg">
      {/* Mobile-friendly top nav */}
      <nav className="border-b border-christ-navy/10 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14 gap-2">
          <span className="font-display font-bold text-christ-navy text-sm">IoT at CHRIST</span>
          <div className="flex items-center gap-2">
            {canPreview && (
              <form action={togglePreviewRoleAction}>
                <button
                  type="submit"
                  className="font-mono text-xs font-bold text-christ-blue border border-christ-blue/30 px-2 py-0.5 rounded-full hover:bg-christ-blue/10 transition-colors"
                >
                  Back to Teacher view
                </button>
              </form>
            )}
            {/* XP chip */}
            <span className="font-mono text-xs font-bold text-christ-gold border border-christ-gold/30 px-2 py-0.5 rounded-full">
              {totalXP} XP
            </span>
          </div>
        </div>
        {/* Scrollable nav row */}
        <div className="max-w-5xl mx-auto px-4 flex gap-4 overflow-x-auto pb-2 -mt-1 scrollbar-none">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-body whitespace-nowrap text-christ-navy/60 hover:text-christ-saffron transition-colors pb-1"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
