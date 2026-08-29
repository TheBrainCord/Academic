import { BoardThumb } from '@/components/simulator/BoardArt'
import { BOARDS } from '@/lib/simulator/boards'
import { HARDWARE_BOARD_IDS } from '@/content/hardware-lessons'
import type { BoardId } from '@/types/simulator'

export function BoardExplorer({ selected, onSelect, labelsVisible }: { selected: BoardId; onSelect: (id: BoardId) => void; labelsVisible: boolean }) {
  return <section aria-labelledby="board-heading"><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-mono uppercase tracking-[.2em] text-christ-saffron">01 · Controller</p><h2 id="board-heading" className="text-lg font-bold">Choose your board</h2></div><span className="text-xs text-christ-navy/50">3 options</span></div>
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Controller board">
      {HARDWARE_BOARD_IDS.map(id => { const board = BOARDS[id]; const active = id === selected; return <button key={id} type="button" role="radio" aria-checked={active} onClick={() => onSelect(id)} className={`min-h-28 rounded-xl border p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-christ-saffron ${active ? 'border-christ-saffron bg-orange-50 shadow-sm' : 'border-christ-navy/10 bg-white hover:border-christ-navy/30'}`}><div className="flex justify-center"><BoardThumb board={board} size={58} /></div><strong className="mt-1 block text-center text-[11px] leading-tight">{board.name.replace(' DevKit','').replace(' 4','')}</strong>{labelsVisible && <span className="mt-1 block text-center font-mono text-[9px] text-christ-navy/50">{board.logicVoltage}V · {board.hasAnalogIn ? 'ADC' : 'No ADC'}</span>}</button> })}
    </div>
    <div className="mt-3 rounded-lg bg-christ-navy p-3 text-white"><p className="text-sm font-semibold">{BOARDS[selected].name}</p><p className="mt-1 text-xs leading-relaxed text-white/70">{BOARDS[selected].description}</p></div>
  </section>
}
