import type { ReactNode } from 'react'
import Link from 'next/link'

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

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-christ-bg">
      <nav className="border-b border-christ-navy/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-6 h-14">
          <span className="font-display font-bold text-christ-navy">IoT at CHRIST</span>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-body text-christ-navy/70 hover:text-christ-saffron transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
