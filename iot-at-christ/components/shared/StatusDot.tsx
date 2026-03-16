const STATUS_COLORS: Record<string, string> = {
  active:   'bg-christ-green',
  pending:  'bg-christ-gold',
  graded:   'bg-christ-green',
  locked:   'bg-christ-navy/30',
  invited:  'bg-christ-navy/30',
  submitted: 'bg-christ-saffron',
  error:    'bg-christ-red',
}

export function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-christ-navy/20'}`}
      title={status}
    />
  )
}
