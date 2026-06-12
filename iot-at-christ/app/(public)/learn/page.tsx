import Link from 'next/link'
import { ArrowRight, Clock, Cpu } from 'lucide-react'
import { UNIT2_MODULES } from '@/content/lectures/unit2'

// Unit 2 lecture gallery — pick a module to open its slide deck.
export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-mono text-christ-saffron uppercase tracking-widest">
          Unit 2 · Hardware Layer
        </p>
        <h1 className="text-3xl font-display font-bold text-christ-navy mt-1">
          Lecture Modules
        </h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1 max-w-2xl">
          From silicon physics to a manufactured PCB — wiring, code and research ideas for each topic,
          linked straight into the Virtual Lab.
        </p>
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
    </div>
  )
}
