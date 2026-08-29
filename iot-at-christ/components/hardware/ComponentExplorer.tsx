import { ComponentThumb } from '@/components/simulator/ComponentArt'
import { COMPONENTS } from '@/lib/simulator/components'
import type { ComponentId } from '@/types/simulator'

export function ComponentExplorer({ sensor, actuator, sensorValue, onSensorValue }: { sensor: ComponentId; actuator: ComponentId; sensorValue: number; onSensorValue: (value: number) => void }) {
  return <section aria-labelledby="parts-heading" className="rounded-xl border border-christ-navy/10 bg-white p-4"><p className="text-[10px] font-mono uppercase tracking-[.2em] text-christ-saffron">02 · Inputs & outputs</p><h2 id="parts-heading" className="text-lg font-bold">Component explorer</h2>
    <div className="mt-3 grid grid-cols-2 gap-2">{[sensor, actuator].map(id => <div key={id} className="rounded-lg bg-christ-bg p-3 text-center"><div className="flex h-12 items-center justify-center"><ComponentThumb componentId={id} size={66} /></div><p className="text-xs font-semibold">{COMPONENTS[id].name}</p><span className="text-[9px] font-mono uppercase text-christ-navy/45">{COMPONENTS[id].category}</span></div>)}</div>
    <label htmlFor="temperature" className="mt-4 flex justify-between text-xs font-semibold"><span>Sensor temperature</span><output>{sensorValue}°C</output></label><input id="temperature" className="mt-2 h-12 w-full accent-christ-saffron" type="range" min="18" max="40" value={sensorValue} onChange={e => onSensorValue(Number(e.target.value))} />
    <p className="text-[11px] text-christ-navy/55">Move the real-world input. The alert threshold is 28°C.</p>
  </section>
}
