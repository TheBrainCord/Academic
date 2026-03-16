const DOMAIN_COLORS: Record<string, string> = {
  Defence:       'border-christ-red/30 text-christ-red',
  Health:        'border-christ-green/30 text-christ-green',
  'Smart City':  'border-christ-saffron/30 text-christ-saffron',
  Agriculture:   'border-christ-gold/30 text-christ-gold',
  Security:      'border-christ-red/30 text-christ-red',
}

export function DomainTag({ domain }: { domain: string }) {
  const colors = DOMAIN_COLORS[domain] ?? 'border-christ-navy/20 text-christ-navy/50'
  return (
    <span className={`text-xs font-mono border px-2 py-0.5 rounded ${colors}`}>
      {domain}
    </span>
  )
}
