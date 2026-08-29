import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import type { WeeklyPlan } from '@/types/course'

export function CourseStudioCard({ plan }: { plan: WeeklyPlan }) {
  return (
    <Link href={`/learn/${plan.id}`} className="group block rounded-xl border border-christ-saffron/30 bg-white p-5 transition hover:border-christ-saffron hover:shadow-md">
      <div className="flex items-center justify-between"><span className="text-3xl" aria-hidden>{plan.icon}</span><span className="font-mono text-[10px] text-christ-gold">WEEKEND {plan.week}</span></div>
      <h3 className="mt-3 font-display text-lg font-bold text-christ-navy group-hover:text-christ-saffron">{plan.title}</h3>
      <p className="mt-1 text-xs text-christ-navy/60">{plan.subtitle}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-mono text-christ-navy/45"><Clock className="h-3 w-3" /> {plan.durationMinutes} min <span className="ml-auto inline-flex items-center gap-1 text-christ-saffron">Enter studio <ArrowRight className="h-3 w-3" /></span></div>
    </Link>
  )
}
