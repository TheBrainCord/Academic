import { AlertTriangle, CheckCircle2, Info, Stethoscope, XCircle } from 'lucide-react'
import type { IssueSeverity, ValidationResult } from '@/types/simulator'
import { cn } from '@/lib/utils'

const ICONS = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const

const STYLES = {
  error: 'text-christ-red',
  warning: 'text-christ-saffron',
  info: 'text-christ-navy/50',
} as const

const ORDER: IssueSeverity[] = ['error', 'warning', 'info']

export function ValidationPanel({ result, wireCount }: { result: ValidationResult; wireCount: number }) {
  const counts = {
    error: result.issues.filter((i) => i.severity === 'error').length,
    warning: result.issues.filter((i) => i.severity === 'warning').length,
  }
  const sorted = [...result.issues].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity),
  )

  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-3">
      <h2 className="flex items-center gap-1.5 text-sm font-display font-semibold text-christ-navy mb-2">
        <Stethoscope className="h-3.5 w-3.5 text-christ-saffron" /> Test Connections
        {(counts.error > 0 || counts.warning > 0) && (
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px]">
            {counts.error > 0 && (
              <span className="rounded-full bg-christ-red/10 text-christ-red px-1.5 py-0.5">{counts.error} ✗</span>
            )}
            {counts.warning > 0 && (
              <span className="rounded-full bg-christ-saffron/10 text-christ-saffron px-1.5 py-0.5">{counts.warning} !</span>
            )}
          </span>
        )}
      </h2>

      {result.ok && wireCount > 0 ? (
        <p className="flex items-center gap-1.5 text-xs font-body text-christ-green">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          All connections look good — ready to run ✓
        </p>
      ) : null}

      {result.issues.length === 0 && wireCount === 0 ? (
        <p className="text-xs font-body text-christ-navy/40">
          Add a part and wire it up — issues and tips will appear here.
        </p>
      ) : null}

      <ul className="space-y-1.5 mt-1.5">
        {sorted.map((issue, i) => {
          const Icon = ICONS[issue.severity]
          return (
            <li key={i} className={cn('flex items-start gap-1.5 text-xs font-body', STYLES[issue.severity])}>
              <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{issue.message}</span>
            </li>
          )
        })}
      </ul>

      {counts.error > 0 && (
        <p className="mt-2 rounded-md bg-christ-bg px-2.5 py-1.5 text-[11px] font-body text-christ-navy/50">
          You can still press <span className="text-christ-saffron font-semibold">Run Anyway</span> to watch
          what these mistakes do to real hardware — safely.
        </p>
      )}
    </div>
  )
}
