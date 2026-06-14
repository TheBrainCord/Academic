'use client'

import {
  X,
  Zap,
  Wrench,
  Factory,
  GraduationCap,
  Sprout,
  Car,
  Stethoscope,
  Building2,
  Home,
  ShoppingCart,
  Plane,
  Bot,
  Smartphone,
} from 'lucide-react'
import { getComponent } from '@/lib/simulator/components'
import { getGuide } from '@/lib/simulator/component-guides'
import { ComponentThumb } from '@/components/simulator/ComponentArt'
import type { ComponentId } from '@/types/simulator'

/** Pick an icon that visually matches an industry sector name. */
function sectorIcon(sector: string) {
  const s = sector.toLowerCase()
  if (s.includes('agri') || s.includes('farm') || s.includes('crop') || s.includes('soil')) return Sprout
  if (s.includes('auto') || s.includes('vehicle') || s.includes('car') || s.includes('transport')) return Car
  if (s.includes('health') || s.includes('hospital') || s.includes('medical') || s.includes('wearable')) return Stethoscope
  if (s.includes('industr') || s.includes('factory') || s.includes('manufactur') || s.includes('robot')) return Bot
  if (s.includes('smart home') || s.includes('home') || s.includes('appliance')) return Home
  if (s.includes('retail') || s.includes('vending') || s.includes('logistics')) return ShoppingCart
  if (s.includes('drone') || s.includes('aero') || s.includes('flight')) return Plane
  if (s.includes('phone') || s.includes('consumer') || s.includes('mobile')) return Smartphone
  if (s.includes('infrastructure') || s.includes('building') || s.includes('civil') || s.includes('city')) return Building2
  return Factory
}

export function ComponentGuide({
  componentId,
  onClose,
}: {
  componentId: ComponentId | null
  onClose: () => void
}) {
  if (!componentId) return null
  const def = getComponent(componentId)
  const guide = getGuide(componentId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-christ-navy/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${def.name} guide`}
    >
      <div
        className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-christ-navy/10 px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="shrink-0 rounded-lg bg-christ-bg p-1.5">
              <ComponentThumb componentId={componentId} size={48} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-christ-saffron">{def.glyph}</span>
                <h2 className="font-display font-bold text-christ-navy">{def.name}</h2>
              </div>
              <p className="text-[11px] font-body text-christ-navy/50 mt-0.5">{def.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="shrink-0 rounded-full p-1.5 text-christ-navy/50 hover:bg-christ-bg hover:text-christ-red transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* How it works */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-display font-semibold text-christ-navy uppercase tracking-wide mb-1.5">
              <Zap className="h-3.5 w-3.5 text-christ-saffron" /> How it works
            </h3>
            <div className="flex items-start gap-3">
              <span className="hidden sm:block shrink-0 rounded-lg border border-christ-navy/10 bg-christ-bg p-2">
                <ComponentThumb componentId={componentId} size={64} />
              </span>
              <div>
                <p className="text-sm font-body text-christ-navy/70">{guide.howItWorks}</p>
                <p className="mt-2 text-xs font-body text-christ-navy/50 border-l-2 border-christ-saffron/40 pl-2">
                  {guide.signal}
                </p>
              </div>
            </div>
          </section>

          {/* Wiring recipe */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-display font-semibold text-christ-navy uppercase tracking-wide mb-1.5">
              <Wrench className="h-3.5 w-3.5 text-christ-saffron" /> How to wire it
            </h3>
            <ol className="list-decimal pl-5 space-y-1">
              {guide.wiring.map((step, i) => (
                <li key={i} className="text-sm font-body text-christ-navy/70 font-mono text-[13px]">
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {/* Industry uses */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-display font-semibold text-christ-navy uppercase tracking-wide mb-1.5">
              <Factory className="h-3.5 w-3.5 text-christ-saffron" /> Where the IoT industry uses it
            </h3>
            <div className="space-y-2">
              {guide.industryUses.map((use) => {
                const Icon = sectorIcon(use.sector)
                return (
                  <div key={use.sector} className="flex items-start gap-2 rounded-md bg-christ-bg px-3 py-2">
                    <Icon className="h-4 w-4 shrink-0 mt-0.5 text-christ-saffron" />
                    <div>
                      <p className="text-xs font-display font-semibold text-christ-navy">{use.sector}</p>
                      <p className="text-xs font-body text-christ-navy/60 mt-0.5">{use.example}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Key takeaway */}
          <section className="rounded-md border border-christ-gold/30 bg-christ-gold/5 px-3 py-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-display font-semibold text-christ-gold uppercase tracking-wide mb-1">
              <GraduationCap className="h-3.5 w-3.5" /> Remember this
            </h3>
            <p className="text-sm font-body text-christ-navy/80">{guide.keyTakeaway}</p>
          </section>
        </div>
      </div>
    </div>
  )
}
