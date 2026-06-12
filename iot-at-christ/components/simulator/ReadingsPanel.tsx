import { Activity } from 'lucide-react'
import type { SensorReading } from '@/types/simulator'

/** A sensor reading enriched with its expected range, so we can draw a gauge. */
export interface GaugedReading extends SensorReading {
  min: number
  max: number
}

export function ReadingsPanel({ readings, running }: { readings: GaugedReading[]; running: boolean }) {
  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white p-3">
      <h2 className="flex items-center gap-1.5 text-sm font-display font-semibold text-christ-navy mb-2">
        <Activity className="h-3.5 w-3.5 text-christ-green" /> Live Readings
        {running && <span className="ml-auto h-2 w-2 rounded-full bg-christ-green animate-pulse" />}
      </h2>

      {!running && (
        <p className="text-xs font-body text-christ-navy/40">
          Press “Run Simulation” to see sensor values stream in here, like a real dashboard.
        </p>
      )}

      {running && readings.length === 0 && (
        <p className="text-xs font-body text-christ-navy/40">
          No powered sensors yet — wire one up (VCC + GND + signal) to see live readings.
        </p>
      )}

      {readings.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {readings.map((r, i) => {
            const span = r.max - r.min
            const pct = span > 0 ? Math.min(100, Math.max(0, ((r.value - r.min) / span) * 100)) : 0
            return (
              <div key={`${r.instanceId}-${r.label}-${i}`} className="rounded-md border border-christ-navy/10 px-2 py-1.5">
                <div className="text-[10px] font-body text-christ-navy/50">{r.label}</div>
                <div className="font-mono text-base font-bold text-christ-navy">
                  {r.value}
                  {r.unit ? <span className="text-xs font-body text-christ-navy/50 ml-1">{r.unit}</span> : null}
                </div>
                {/* gauge: where the value sits in the sensor's range */}
                <div className="mt-1 h-1.5 rounded-full bg-christ-navy/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-christ-green transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-christ-navy/30 mt-0.5">
                  <span>{r.min}</span>
                  <span>{r.max}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
