import Link from 'next/link'
import { ArrowRight, Atom, Cable, Clock, Cpu, Rocket, TerminalSquare } from 'lucide-react'
import { UNIT2_MODULES } from '@/content/lectures/unit2'

// Unit 2 interactive lecture gallery — the PPT replacement. Public like the
// Virtual Lab: no login, no database, teachable from any browser.
export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-christ-saffron uppercase tracking-widest">
          Unit 2 · Hardware Layer
        </p>
        <h1 className="text-3xl font-display font-bold text-christ-navy mt-1">
          Interactive Lecture Modules
        </h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1 max-w-2xl">
          Four step-by-step teaching decks — from silicon physics to a manufactured PCB. Each module
          follows the same arc: <span className="text-christ-navy">hardware physics from scratch → simulator
          wiring → code execution breakdown → an M.Sc. research spark</span>, and links straight into the
          Virtual Lab so the class can wire what was just taught.
        </p>
      </div>

      {/* The 4-part method, stated once */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Atom, label: '1 · Physics from scratch', tone: 'text-christ-saffron' },
          { icon: Cable, label: '2 · Simulator wiring', tone: 'text-christ-green' },
          { icon: TerminalSquare, label: '3 · Code breakdown', tone: 'text-christ-navy' },
          { icon: Rocket, label: '4 · Research spark', tone: 'text-christ-gold' },
        ].map(({ icon: Icon, label, tone }) => (
          <div key={label} className="rounded-lg border border-christ-navy/10 bg-white px-3 py-2 flex items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
            <span className="text-[11px] font-body text-christ-navy/70">{label}</span>
          </div>
        ))}
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
                Teach it <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-[11px] font-body text-christ-navy/40">
        Units 1 and 3–7 get their decks next — the structure you see here is the template for the whole syllabus.
      </p>
    </div>
  )
}
