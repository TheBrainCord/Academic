interface Props {
  src?:      string | null
  name:      string
  size?:     'sm' | 'md' | 'lg'
}

const SIZE: Record<string, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-base',
}

export function Avatar({ src, name, size = 'md' }: Props) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${SIZE[size]} rounded-full object-cover`}
      />
    )
  }

  return (
    <div className={`${SIZE[size]} rounded-full bg-christ-navy/10 flex items-center justify-center font-mono font-bold text-christ-navy/60`}>
      {initials}
    </div>
  )
}
