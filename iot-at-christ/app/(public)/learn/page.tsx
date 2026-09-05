import Link from 'next/link'
import { ArrowRight, Clock, Cpu } from 'lucide-react'
import { UNIT2_MODULES } from '@/content/lectures/unit2'
import { UNIT4_DECKS } from '@/content/lectures/unit4'
import { WEEKLY_PLANS } from '@/content/course'
import { CourseStudioCard } from '@/components/course'

// Unit 2 lecture gallery — pick a module to open its slide deck.
export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-christ-saffron uppercase tracking-widest">Guided weekend learning</p>
        <h1 className="text-3xl font-display font-bold text-christ-navy mt-1">Course Studio</h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1 max-w-2xl">Build an IoT system one evidence-led weekend at a time. Each studio includes preparation, a touchscreen-ready teacher run sheet, a knowledge check and a practical exam.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WEEKLY_PLANS.map((plan) => <CourseStudioCard key={plan.id} plan={plan} />)}
      </div>

      <div className="border-t border-christ-navy/10 pt-8">
        <p className="text-xs font-mono text-christ-saffron uppercase tracking-widest">
          Unit 2 · Hardware Layer
        </p>
        <h2 className="text-3xl font-display font-bold text-christ-navy mt-1">
          Lecture Modules
        </h2>
        <p className="text-sm font-body text-christ-navy/60 mt-1 max-w-2xl">
          From silicon physics to a manufactured PCB — wiring, code and research ideas for each topic,
          linked straight into the Virtual Lab.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
      <Link href="/learn/hardware/led-current-limiting" className="group block overflow-hidden rounded-2xl bg-christ-navy p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex h-full flex-col justify-between gap-4"><div><span className="rounded-full bg-christ-saffron px-3 py-1 font-mono text-[10px] uppercase tracking-wider">Interactive hardware studio</span><h2 className="mt-3 text-2xl font-bold">Safe LED circuit across three boards</h2><p className="mt-1 text-sm text-white/65">Wire, calculate, inject a fault, connect code to hardware, collect evidence, and revise for the exam.</p></div><span className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-christ-navy">Open studio <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></div>
      </Link>
      <Link href="/learn/protocols/mqtt" className="group block rounded-2xl bg-blue-950 p-5 text-white shadow-sm"><div className="flex h-full flex-col justify-between gap-4"><div><span className="rounded-full bg-blue-500 px-3 py-1 font-mono text-[10px] uppercase tracking-wider">Visual protocol laboratory</span><h2 className="mt-3 text-2xl font-bold">Step through an MQTT packet journey</h2><p className="mt-1 text-sm text-white/65">Pause, drop, duplicate and reconnect packets while comparing QoS, retained state, LWT and idempotency.</p></div><span className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-950">Open lab <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1"/></span></div></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {UNIT2_MODULES.map((mod) => (
          <Link
            key={mod.id}
            href={`/learn/${mod.id}`}
            className="group rounded-xl border border-christ-navy/10 bg-white p-5 hover:border-christ-saffron/60 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl" aria-hidden>{mod.icon}</span>
              <span className="font-mono text-[10px] text-christ-gold border border-christ-gold/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                Session {mod.session}
              </span>
            </div>
            <h2 className="font-display font-bold text-christ-navy mt-3 group-hover:text-christ-saffron transition-colors">
              {mod.title}
            </h2>
            <p className="text-xs font-body text-christ-navy/55 mt-1.5">{mod.subtitle}</p>
            <div className="flex items-center gap-3 mt-4 text-[11px] font-mono text-christ-navy/40">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> ~{mod.minutes} min</span>
              <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3" /> {mod.board}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-christ-saffron">
                Open <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-christ-navy/10 pt-8">
        <p className="text-xs font-mono text-christ-green uppercase tracking-widest">
          Unit 4 · IoT Data and Services
        </p>
        <h2 className="mt-1 text-3xl font-display font-bold text-christ-navy">
          60-Minute Teaching Decks
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-body text-christ-navy/60">
          Touchscreen-ready sessions with a live timer, revealable teacher cues, class votes,
          ESP32 builds, code walkthroughs and evidence-based exit checks.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {UNIT4_DECKS.map((deck) => (
          <Link
            key={deck.id}
            href={`/learn/${deck.id}`}
            className="group flex flex-col rounded-2xl border border-christ-green/20 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-christ-green/60 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl" aria-hidden>{deck.icon}</span>
              <span className="rounded-full border border-christ-green/25 bg-christ-green/5 px-2.5 py-1 font-mono text-[10px] text-christ-green">
                SESSION {deck.session}
              </span>
            </div>
            <h3 className="mt-3 font-display text-lg font-bold text-christ-navy transition-colors group-hover:text-christ-green">
              {deck.title}
            </h3>
            <p className="mt-1.5 flex-1 text-xs leading-relaxed text-christ-navy/60">{deck.subtitle}</p>
            <div className="mt-5 flex items-center gap-3 font-mono text-[11px] text-christ-navy/45">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {deck.minutes} min</span>
              <span>{deck.slides.length} slides</span>
              <span className="ml-auto inline-flex items-center gap-1 font-semibold text-christ-green">
                Teach <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
