import { Workbench } from '@/components/simulator/Workbench'

// Server Component shell — all interactivity lives in the client Workbench.
export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-christ-navy">
          Virtual Hardware Lab
        </h1>
        <p className="text-sm font-body text-christ-navy/60 mt-1">
          Practice wiring Arduino, ESP32 and Raspberry Pi circuits right in the
          browser — no hardware needed.
        </p>
      </div>
      <Workbench />
    </div>
  )
}
