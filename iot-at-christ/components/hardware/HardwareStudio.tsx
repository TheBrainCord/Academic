'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Eye, EyeOff, Maximize2, Pause, Play, RotateCcw, StickyNote, Tag, Timer } from 'lucide-react'
import type { HardwareLesson } from '@/content/hardware-lessons'
import type { BoardId } from '@/types/simulator'
import { BoardExplorer } from './BoardExplorer'
import { CircuitCanvas } from './CircuitCanvas'
import { ComponentExplorer } from './ComponentExplorer'
import { SignalFlowAnimation } from './SignalFlowAnimation'
import { WiringValidator } from './WiringValidator'

const control = 'inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-christ-navy/15 bg-white px-3 text-xs font-semibold shadow-sm transition hover:bg-christ-bg focus:outline-none focus:ring-2 focus:ring-christ-saffron'

export function HardwareStudio({ lesson }: { lesson: HardwareLesson }) {
  const [board, setBoard] = useState<BoardId>('arduino-uno')
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [fault, setFault] = useState(false)
  const [sensorValue, setSensorValue] = useState(24)
  const [labels, setLabels] = useState(true)
  const [notes, setNotes] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => { if (!running || fault) return; const id = window.setInterval(() => setSeconds(s => s + 1), 1000); return () => window.clearInterval(id) }, [running, fault])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.code !== 'Space' || ['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      event.preventDefault()
      if (!fault) setRunning(value => !value)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fault])
  const reset = () => { setStep(0); setRunning(false); setFault(false); setSensorValue(24); setSeconds(0) }
  const current = lesson.steps[step]
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <div className="hardware-studio space-y-5">
    <header className="rounded-2xl bg-christ-navy px-5 py-6 text-white md:px-7"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-orange-300">{lesson.eyebrow}</p><h1 className="mt-2 text-3xl font-bold md:text-4xl">{lesson.title}</h1><p className="mt-2 text-sm leading-relaxed text-white/65">{lesson.summary}</p></div><div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right"><p className="font-mono text-2xl tabular-nums">{clock}</p><p className="text-[10px] uppercase tracking-wider text-white/50">presentation timer</p></div></div></header>

    <div className="teacher-controls sticky top-16 z-[5] flex flex-wrap gap-2 rounded-2xl border border-christ-navy/10 bg-white/95 p-2 shadow-sm backdrop-blur" role="toolbar" aria-label="Teacher presentation controls">
      <button className={control} onClick={() => setRunning(v => !v)} aria-pressed={running}>{running ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}{running ? 'Pause' : 'Run'}</button>
      <button className={control} onClick={() => setStep(s => Math.min(lesson.steps.length - 1, s + 1))} disabled={step === lesson.steps.length - 1}><Eye className="h-4 w-4"/>Reveal next</button>
      <button className={control} onClick={() => setLabels(v => !v)} aria-pressed={labels}><Tag className="h-4 w-4"/>{labels ? 'Hide labels' : 'Reveal labels'}</button>
      <button className={control} onClick={() => setNotes(v => !v)} aria-expanded={notes}>{notes ? <EyeOff className="h-4 w-4"/> : <StickyNote className="h-4 w-4"/>}Notes</button>
      <button className={control} onClick={() => document.documentElement.requestFullscreen?.()}><Maximize2 className="h-4 w-4"/>Present</button>
      <button className={`${control} text-red-700`} onClick={() => { setFault(true); setRunning(false) }}><AlertTriangle className="h-4 w-4"/>Inject fault</button>
      <button className={control} onClick={reset}><RotateCcw className="h-4 w-4"/>Reset</button>
      <span className="ml-auto hidden items-center gap-2 px-3 font-mono text-xs text-christ-navy/50 md:flex"><Timer className="h-4 w-4"/>Space = run/pause</span>
    </div>

    {notes && <aside className="lecturer-notes rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4"><p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">Lecturer notes · hidden from print</p><p className="mt-1 text-sm">Ask learners to predict the next wire before revealing it. Contrast “energy moving” with “information encoded.” Deliberately inject the short only after learners identify the safe return path.</p></aside>}

    <div className="grid gap-5 lg:grid-cols-[280px_1fr]"><div className="space-y-4"><BoardExplorer selected={board} onSelect={setBoard} labelsVisible={labels}/><ComponentExplorer sensor={lesson.component} actuator={lesson.actuator} sensorValue={sensorValue} onSensorValue={setSensorValue}/></div><div className="space-y-4"><CircuitCanvas boardId={board} sensor={lesson.component} actuator={lesson.actuator} step={step} running={running} fault={fault} labelsVisible={labels}/><SignalFlowAnimation running={running && step >= 4 && !fault} sensorValue={sensorValue}/><WiringValidator step={step} fault={fault}/></div></div>

    <section className="rounded-2xl border border-christ-navy/10 bg-white p-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-christ-saffron">Progressive reveal · {step + 1}/{lesson.steps.length}</p><h2 className="mt-1 text-xl font-bold">{current.title}</h2></div><span className="rounded-full bg-christ-bg px-3 py-1 text-xs">~{lesson.duration} min lesson</span></div><p className="mt-3 text-sm text-christ-navy/70">{current.instruction}</p><div className="mt-4 rounded-lg bg-christ-navy px-4 py-3 font-mono text-sm text-white">{current.connection}</div><div className="mt-4 grid gap-3 md:grid-cols-3"><Evidence label="Conceptual model" color="bg-sky-100 text-sky-800" text={current.concept}/><Evidence label="Logic / inference" color="bg-violet-100 text-violet-800" text={current.logic}/><Evidence label="Real-world evidence" color="bg-emerald-100 text-emerald-800" text={current.evidence}/></div><div className="mt-5 flex gap-2"><button className={control} onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Previous</button><button className={`${control} border-christ-saffron bg-christ-saffron text-white hover:bg-orange-600`} onClick={() => setStep(s => Math.min(lesson.steps.length - 1, s + 1))} disabled={step === lesson.steps.length - 1}>Reveal next step</button></div></section>
  </div>
}

function Evidence({ label, color, text }: { label: string; color: string; text: string }) { return <article className="rounded-xl border border-christ-navy/10 p-3"><span className={`inline-block rounded-full px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider ${color}`}>{label}</span><p className="mt-2 text-xs leading-relaxed text-christ-navy/70">{text}</p></article> }
