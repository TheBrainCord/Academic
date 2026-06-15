import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { canTogglePreviewRole } from '@/lib/auth/access'
import { togglePreviewRoleAction } from '@/app/actions/preview-role'
import { MobileNav } from '@/components/layout/MobileNav'

const navItems = [
  { href: '/teacher/dashboard',   label: 'Dashboard' },
  { href: '/teacher/usage',       label: 'Simulator Usage' },
  { href: '/teacher/curriculum',  label: 'Curriculum' },
  { href: '/teacher/students',    label: 'Students' },
  { href: '/teacher/assignments', label: 'Assignments' },
  { href: '/teacher/forum',       label: 'Forum' },
  { href: '/teacher/research',    label: 'Research' },
  { href: '/teacher/reminders',   label: 'Reminders' },
]

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const canPreview = canTogglePreviewRole(user?.email)

  return (
    <div className="min-h-screen bg-christ-bg">
      {/* Mobile-friendly top nav */}
      <nav className="border-b border-christ-navy/10 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 gap-2">
          <span className="font-display font-bold text-christ-navy text-sm">IoT at CHRIST</span>
          <div className="flex items-center gap-2">
            {canPreview && (
              <form action={togglePreviewRoleAction}>
                <button
                  type="submit"
                  className="font-mono text-xs font-bold text-christ-saffron border border-christ-saffron/30 px-2 py-0.5 rounded-full hover:bg-christ-saffron/10 transition-colors"
                >
                  Preview as Student
                </button>
              </form>
            )}
            {/* Role chip */}
            <span className="font-mono text-xs font-bold text-christ-blue border border-christ-blue/30 px-2 py-0.5 rounded-full">
              Teacher
            </span>
            <MobileNav items={navItems} />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
