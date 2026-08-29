import { ArrowRight } from 'lucide-react'

export function SignalFlowAnimation({ running, sensorValue }: { running: boolean; sensorValue: number }) {
  const alert = running && sensorValue >= 28
  return <div className="rounded-xl border border-christ-navy/10 bg-white p-3" aria-live="polite"><div className="flex items-center justify-between gap-2 text-center text-xs font-semibold"><span className={`rounded-lg px-3 py-2 ${running ? 'bg-sky-100 text-sky-800' : 'bg-slate-100'}`}>Sense<br/><b>{sensorValue}°C</b></span><ArrowRight className={`h-4 w-4 text-sky-500 ${running ? 'hardware-flow' : ''}`} aria-hidden/><span className={`rounded-lg px-3 py-2 ${running ? 'bg-violet-100 text-violet-800' : 'bg-slate-100'}`}>Think<br/><b>≥ 28?</b></span><ArrowRight className={`h-4 w-4 text-violet-500 ${running ? 'hardware-flow' : ''}`} aria-hidden/><span className={`rounded-lg px-3 py-2 ${alert ? 'bg-amber-100 text-amber-800 shadow-[0_0_18px_rgba(245,158,11,.35)]' : 'bg-slate-100'}`}>Act<br/><b>{alert ? 'LED ON' : 'LED OFF'}</b></span></div><p className="mt-2 text-center font-mono text-[10px] text-christ-navy/45">blue = data · amber = physical output</p></div>
}
