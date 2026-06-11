import type { SensorReading } from '@/types/simulator'

export function ReadingsPanel({ readings, running }: { readings: SensorReading[]; running: boolean }) {
  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-3">
      <h2 className="text-sm font-display font-semibold text-christ-navy mb-2">Live Readings</h2>

      {!running && (
        <p className="text-xs font-body text-christ-navy/40">
          Press “Run Simulation” to see fake sensor values update here.
        </p>
      )}

      {running && readings.length === 0 && (
        <p className="text-xs font-body text-christ-navy/40">
          No powered sensors yet — wire one up to see live readings.
        </p>
      )}

      {readings.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {readings.map((r, i) => (
            <div key={`${r.instanceId}-${r.label}-${i}`} className="rounded-md border border-christ-navy/10 px-2 py-1.5">
              <div className="text-[10px] font-body text-christ-navy/50">{r.label}</div>
              <div className="font-mono text-base font-bold text-christ-navy">
                {r.value}
                {r.unit ? <span className="text-xs font-body text-christ-navy/50 ml-1">{r.unit}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
