import { CircuitBoard, Flame, MousePointerClick } from 'lucide-react'
import { Workbench } from '@/components/simulator/Workbench'

// Public Virtual Lab — same workbench as /student/simulator, no login needed.
// Bench + challenge progress live in localStorage either way.
export default function PublicLabPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-christ-navy">Virtual Hardware Lab</h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1">
          Practice wiring Arduino, ESP32 and Raspberry Pi circuits right in the browser — no
          hardware, no account needed. Tap the ⓘ on any part to learn how it works and where the
          IoT industry uses it.
        </p>
      </div>

      {/* How the lab works, in three steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="flex items-start gap-2.5 rounded-lg border border-christ-navy/10 bg-white px-3 py-2.5">
          <CircuitBoard className="h-4 w-4 text-christ-saffron shrink-0 mt-0.5" />
          <p className="text-[11px] font-body text-christ-navy/60">
            <span className="font-semibold text-christ-navy">1 · Build.</span> Pick a board, add parts
            from the bin, then tap a terminal and a pin to run a wire between them.
          </p>
        </div>
        <div className="flex items-start gap-2.5 rounded-lg border border-christ-navy/10 bg-white px-3 py-2.5">
          <MousePointerClick className="h-4 w-4 text-christ-green shrink-0 mt-0.5" />
          <p className="text-[11px] font-body text-christ-navy/60">
            <span className="font-semibold text-christ-navy">2 · Run.</span> Watch LEDs glow, buzzers
            buzz and live sensor readings stream into the serial monitor.
          </p>
        </div>
        <div className="flex items-start gap-2.5 rounded-lg border border-christ-navy/10 bg-white px-3 py-2.5">
          <Flame className="h-4 w-4 text-christ-red shrink-0 mt-0.5" />
          <p className="text-[11px] font-body text-christ-navy/60">
            <span className="font-semibold text-christ-navy">3 · Break it (on purpose).</span> Wired
            something wrong? Run it anyway — see the smoke, then learn exactly why it failed.
          </p>
        </div>
      </div>

      <Workbench />
    </div>
  )
}
