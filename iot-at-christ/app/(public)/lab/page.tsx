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
      <Workbench />
    </div>
  )
}
