'use client'

import { useState } from 'react'
import { CheckCircle2, Pause, Play, RotateCcw, ShieldAlert } from 'lucide-react'
import { HARDWARE_BOARD_BY_ID } from '@/content/hardware'
import type { HardwareBoardId, HardwareLesson } from '@/types/hardware'

const button = 'min-h-12 rounded-xl border border-christ-navy/15 bg-white px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-christ-saffron disabled:opacity-50'

export function HardwareLessonStudio({ lesson }: { lesson: HardwareLesson }) {
  const [boardId, setBoardId] = useState<HardwareBoardId>(lesson.boards[0])
  const [step, setStep] = useState(0)
  const [powered, setPowered] = useState(false)
  const [fault, setFault] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const board = HARDWARE_BOARD_BY_ID[boardId]
  const connection = lesson.connections.find(item => item.boardId === boardId)!
  const code = lesson.codeSections.find(item => item.boardId === boardId)!

  const reset = () => { setStep(0); setPowered(false); setFault(false); setAnswers({}) }

  return <div className="hardware-studio space-y-6">
    <header className="rounded-2xl bg-christ-navy p-6 text-white md:p-8">
      <p className="font-mono text-xs uppercase tracking-[.2em] text-orange-300">Hardware Learning Studio · verified lesson</p>
      <h1 className="mt-2 text-3xl font-bold md:text-5xl">{lesson.title}</h1>
      <p className="mt-3 max-w-3xl text-white/70">{lesson.summary}</p>
    </header>

    <nav className="teacher-controls sticky top-16 z-10 flex flex-wrap gap-2 rounded-2xl border bg-white/95 p-3 shadow-sm backdrop-blur" aria-label="Lesson controls">
      <button className={button} onClick={() => setPowered(value => !value)} disabled={fault}>{powered ? <Pause className="mr-2 inline h-4 w-4"/> : <Play className="mr-2 inline h-4 w-4"/>}{powered ? 'Power off' : 'Power circuit'}</button>
      <button className={button} onClick={() => setStep(value => Math.min(lesson.procedure.length - 1, value + 1))}>Reveal next</button>
      <button className={`${button} text-red-700`} onClick={() => { setFault(true); setPowered(false) }}><ShieldAlert className="mr-2 inline h-4 w-4"/>Inject missing resistor</button>
      <button className={button} onClick={reset}><RotateCcw className="mr-2 inline h-4 w-4"/>Reset</button>
      <button className={button} onClick={() => document.documentElement.requestFullscreen?.()}>Present full screen</button>
    </nav>

    <section className="rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-bold">1. Select requirements before selecting a board</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {lesson.boards.map(id => { const item = HARDWARE_BOARD_BY_ID[id]; return <button key={id} className={`min-h-20 rounded-xl border-2 p-4 text-left ${id === boardId ? 'border-christ-saffron bg-orange-50' : 'border-christ-navy/10'}`} onClick={() => { setBoardId(id); setPowered(false); setFault(false) }} aria-pressed={id === boardId}><strong className="block">{item.name}</strong><span className="text-xs text-christ-navy/60">{item.platform} · {item.electrical.logicVoltage}</span></button> })}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2"><article className="rounded-xl bg-christ-bg p-4"><h3 className="font-bold">Electrical constraints</h3><p className="mt-2 text-sm">GPIO design target: {board.electrical.recommendedGpioCurrentMa} mA · Logic: {board.electrical.logicVoltage}</p><ul className="mt-2 list-disc pl-5 text-sm">{board.electrical.cautions.map(item => <li key={item}>{item}</li>)}</ul></article><article className="rounded-xl bg-christ-bg p-4"><h3 className="font-bold">Explainable connection</h3><p className="mt-2 font-mono text-sm">{connection.path}</p><p className="mt-2 text-sm text-christ-navy/65">{connection.rationale}</p></article></div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
      <article className="rounded-2xl border bg-slate-950 p-5 text-white">
        <div className="flex items-center justify-between"><div><p className="font-mono text-xs uppercase text-orange-300">Conceptual current path</p><h2 className="text-xl font-bold">GPIO → resistor → LED → ground</h2></div><span className={`rounded-full px-3 py-1 text-xs ${fault ? 'bg-red-500' : powered ? 'bg-emerald-500' : 'bg-slate-700'}`}>{fault ? 'Unsafe: resistor absent' : powered ? 'Current flowing' : 'Unpowered'}</span></div>
        <svg className="mt-5 h-52 w-full" viewBox="0 0 760 210" role="img" aria-label={`Conceptual LED circuit for ${board.name}`}>
          <path d="M90 105 H250 M330 105 H455 M520 105 H670" fill="none" stroke={fault ? '#ef4444' : powered ? '#f59e0b' : '#64748b'} strokeWidth="8" strokeLinecap="round" className={powered ? 'hardware-flow' : ''}/>
          <rect x="25" y="65" width="130" height="80" rx="14" fill="#1d4ed8"/><text x="90" y="100" textAnchor="middle" fill="white" fontSize="15">{connection.boardPin}</text><text x="90" y="122" textAnchor="middle" fill="#bfdbfe" fontSize="12">{board.electrical.logicVoltage}</text>
          {fault ? <text x="290" y="112" textAnchor="middle" fill="#fca5a5" fontSize="16">RESISTOR MISSING</text> : <><rect x="250" y="78" width="80" height="54" rx="8" fill="#f8fafc"/><text x="290" y="111" textAnchor="middle" fill="#0f172a" fontSize="14">220–330 Ω</text></>}
          <circle cx="488" cy="105" r="34" fill={powered && !fault ? '#facc15' : '#334155'} className={powered && !fault ? 'hardware-current' : ''}/><text x="488" y="111" textAnchor="middle" fill="white" fontSize="14">LED</text>
          <rect x="640" y="75" width="95" height="60" rx="12" fill="#334155"/><text x="687" y="111" textAnchor="middle" fill="white" fontSize="14">GND</text>
        </svg>
        <p className="rounded-lg bg-white/10 p-3 text-sm">This is a conceptual and logic visualisation, not a physical measurement. Verify voltage and resistor current on real hardware before claiming evidence.</p>
      </article>
      <article className="rounded-2xl border bg-white p-5"><p className="font-mono text-xs uppercase text-christ-saffron">Progressive assembly · {step + 1}/{lesson.procedure.length}</p><h2 className="mt-1 text-xl font-bold">Do, predict, verify</h2><ol className="mt-4 space-y-3">{lesson.procedure.slice(0, step + 1).map((item, index) => <li className="flex gap-3 text-sm" key={item}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-christ-navy text-white">{index + 1}</span><span>{item}</span></li>)}</ol></article>
    </section>

    {fault && <aside className="rounded-2xl border-2 border-red-500 bg-red-50 p-5" role="alert"><h2 className="text-xl font-bold text-red-800">Do not energise this circuit</h2><p className="mt-2 text-sm">An LED does not limit its own current. Excess current can damage both LED and GPIO. Remove power, restore a calculated series resistor, peer-check the path, and only then test.</p></aside>}

    <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Code changes physical hardware</h2><pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100"><code>{code.code}</code></pre><div className="mt-4 space-y-3">{code.hardwareLinks.map(link => <div className="rounded-xl bg-christ-bg p-3" key={link.code}><code className="text-xs font-bold">{link.code}</code><p className="mt-1 text-sm"><strong>{link.hardware}:</strong> {link.explanation}</p></div>)}</div></article><article className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Safety and diagnosis</h2><div className="mt-4 space-y-3">{lesson.safety.map(rule => <details className="rounded-xl border p-3" key={rule.id} open={rule.severity === 'critical'}><summary className="cursor-pointer font-bold">{rule.rule}</summary><p className="mt-2 text-sm">{rule.reason}</p><p className="mt-2 text-xs text-emerald-800"><strong>Evidence:</strong> {rule.evidenceCheck}</p></details>)}</div></article></section>

    <section className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Knowledge check with misconception feedback</h2><div className="mt-4 grid gap-5 lg:grid-cols-3">{lesson.quiz.map(question => { const answer = answers[question.id]; return <fieldset className="rounded-xl border p-4" key={question.id}><legend className="px-1 font-bold">{question.prompt}</legend><div className="mt-3 space-y-2">{question.options.map(option => <button className={`${button} block w-full text-left`} key={option.id} onClick={() => setAnswers(current => ({ ...current, [question.id]: option.id }))}>{option.text}</button>)}</div>{answer && <p className={`mt-3 rounded-lg p-3 text-sm ${answer === question.correctOptionId ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}><CheckCircle2 className="mr-2 inline h-4 w-4"/>{question.options.find(option => option.id === answer)?.feedback} {question.explanation}</p>}</fieldset> })}</div></section>

    <section className="grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Experiments and evidence</h2>{lesson.experiments.map(item => <details className="mt-3 rounded-xl border p-3" key={item.id}><summary className="cursor-pointer font-bold">{item.level.toUpperCase()} · {item.title}</summary><p className="mt-2 text-sm"><strong>Hypothesis:</strong> {item.hypothesis}</p><p className="mt-2 text-sm"><strong>Measure:</strong> {item.measurements.join(', ')}</p></details>)}</article><article className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Exam answer structure</h2>{lesson.examFraming.map(item => <details className="mt-3 rounded-xl border p-3" key={item.prompt}><summary className="cursor-pointer font-bold">{item.prompt}</summary><ol className="mt-2 list-decimal pl-5 text-sm">{item.markingGuide.map(mark => <li key={mark}>{mark}</li>)}</ol></details>)}</article></section>
  </div>
}
