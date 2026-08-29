import type { StudioScheduleItem } from '@/types/course'

export function TeacherBoard({ activity, index, total }: { activity: StudioScheduleItem; index: number; total: number }) {
  return (
    <aside className="rounded-2xl bg-christ-navy p-6 text-white shadow-lg" aria-label="Teacher board prompt">
      <div className="flex items-center justify-between font-mono text-xs text-white/60">
        <span>TEACHER BOARD · {index + 1}/{total}</span><span>{activity.durationMinutes} MIN</span>
      </div>
      <h3 className="mt-3 text-xl font-display font-bold">{activity.title}</h3>
      <p className="mt-4 border-l-4 border-christ-saffron pl-4 text-sm leading-6">{activity.teacherPrompt}</p>
      <div className="mt-5 rounded-lg bg-white/10 p-3 text-sm">
        <span className="font-mono text-[10px] uppercase tracking-widest text-christ-saffron">Visible outcome</span>
        <p className="mt-1 text-white/85">{activity.studentOutcome}</p>
      </div>
    </aside>
  )
}
