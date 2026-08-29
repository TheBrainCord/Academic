import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import type { WeeklyPlan } from '@/types/course'
import { TeacherBoard } from './TeacherBoard'

export function CourseStudio({ plan }: { plan: WeeklyPlan }) {
  return (
    <article className="space-y-8">
      <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-christ-navy/60 hover:text-christ-saffron"><ArrowLeft className="h-4 w-4" /> All learning</Link>
      <header className="rounded-2xl bg-gradient-to-br from-christ-navy to-christ-navy/90 p-7 text-white">
        <p className="font-mono text-xs tracking-widest text-christ-saffron">COURSE STUDIO · WEEKEND {plan.week}</p>
        <h1 className="mt-2 text-3xl font-display font-bold">{plan.icon} {plan.title}</h1>
        <p className="mt-2 text-white/70">{plan.subtitle}</p>
        <p className="mt-5 text-lg font-medium">{plan.essentialQuestion}</p>
        <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs text-white/60"><Clock className="h-4 w-4" /> {plan.durationMinutes} minutes</span>
      </header>

      <section><h2 className="text-xl font-display font-bold text-christ-navy">Learning outcomes</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{plan.learningObjectives.map((item) => <li key={item} className="flex gap-2 text-sm text-christ-navy/75"><CheckCircle2 className="h-4 w-4 shrink-0 text-christ-saffron" />{item}</li>)}</ul></section>

      <section><h2 className="text-xl font-display font-bold text-christ-navy">Studio run sheet</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{plan.schedule.map((activity, index) => <TeacherBoard key={activity.id} activity={activity} index={index} total={plan.schedule.length} />)}</div></section>

      <section className="grid gap-4 md:grid-cols-3">
        <Preparation title="Students" items={plan.preparation.student} />
        <Preparation title="Teacher" items={plan.preparation.teacher} />
        <Preparation title="Equipment" items={plan.preparation.equipment} />
      </section>

      <section className="rounded-xl border border-christ-navy/10 bg-white p-6"><h2 className="font-display text-xl font-bold text-christ-navy">Knowledge check</h2>{plan.quiz.map((question) => <div key={question.id} className="mt-4"><p className="font-medium text-christ-navy">{question.question}</p><ol className="mt-2 list-[upper-alpha] space-y-1 pl-6 text-sm text-christ-navy/70">{question.options.map((option) => <li key={option}>{option}</li>)}</ol><details className="mt-2 text-sm"><summary className="cursor-pointer text-christ-saffron">Reveal answer</summary><p className="mt-1 text-christ-navy/70"><strong>{question.options[question.correctAnswer]}.</strong> {question.explanation}</p></details></div>)}</section>

      <section className="rounded-xl border-l-4 border-christ-saffron bg-christ-saffron/5 p-6"><p className="font-mono text-xs text-christ-gold">PRACTICAL EXAM · {plan.exam.durationMinutes} MIN · PASS {plan.exam.passingPercentage}%</p><h2 className="mt-2 font-display text-xl font-bold text-christ-navy">{plan.exam.title}</h2><p className="mt-2 text-sm text-christ-navy/70">{plan.exam.instructions}</p><ul className="mt-3 list-disc pl-5 text-sm text-christ-navy/70">{plan.exam.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></section>
    </article>
  )
}

function Preparation({ title, items }: { title: string; items: string[] }) {
  return <div className="rounded-xl bg-christ-navy/5 p-4"><h3 className="font-display font-bold text-christ-navy">Prepare · {title}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-christ-navy/65">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>
}
