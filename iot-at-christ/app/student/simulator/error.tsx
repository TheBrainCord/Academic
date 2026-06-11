'use client'

// Error boundary for the Virtual Hardware Lab — never white-screen a student.
export default function SimulatorError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="rounded-lg border border-christ-red/30 bg-white p-8 text-center space-y-3">
      <p className="text-2xl" aria-hidden>
        🔌
      </p>
      <h2 className="text-lg font-display font-semibold text-christ-navy">
        Something went wrong in the lab
      </h2>
      <p className="text-sm font-body text-christ-navy/60">
        Refresh to reset your bench — your saved circuit is safe.
      </p>
      <button
        onClick={reset}
        className="mt-2 inline-flex items-center rounded-md bg-christ-navy px-4 py-2 text-sm font-body text-white hover:bg-christ-navy/90 transition-colors"
      >
        Reset the bench
      </button>
    </div>
  )
}
