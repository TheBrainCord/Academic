import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { ValidationResult } from '@/types/simulator'
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

export function ValidationPanel({ result, wireCount }: { result: ValidationResult; wireCount: number }) {
  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-3">
      <h2 className="text-sm font-display font-semibold text-christ-navy mb-2">Test Connections</h2>

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
        {result.issues.map((issue, i) => {
          const Icon = ICONS[issue.severity]
          return (
            <li key={i} className={cn('flex items-start gap-1.5 text-xs font-body', STYLES[issue.severity])}>
              <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{issue.message}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
