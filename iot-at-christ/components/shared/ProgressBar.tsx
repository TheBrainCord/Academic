interface Props {
  value:     number  // 0-100
  color?:    string
  className?: string
}

export function ProgressBar({ value, color = 'bg-christ-green', className = '' }: Props) {
  return (
    <div className={`h-1.5 bg-christ-navy/10 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full ${color} rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
