import type { ComponentId } from '@/types/simulator'

// Realistic-but-stylised SVG drawings of every part in the palette, so the
// bench feels like a real workbench rather than labelled white boxes.
// Each drawing lives in a 124 x 84 local box: (0,0) top-left. Terminals are
// rendered by BoardCanvas below the box, so legs/pins point downwards.

export const ART_W = 124
export const ART_H = 84

export interface ComponentArtProps {
  componentId: ComponentId
  /** Actuator drive state: boolean on/off or 0..1 PWM level */
  active?: boolean | number
  /** Part destroyed during a failure run (burnout/overvoltage) */
  burned?: boolean
}

/** Brightness 0..1 from an actuator state. */
const level = (active: boolean | number | undefined): number =>
  typeof active === 'number' ? active : active ? 1 : 0

function Legs({ xs, y1, y2 }: { xs: number[]; y1: number; y2: number }) {
  return (
    <>
      {xs.map((x) => (
        <line key={x} x1={x} y1={y1} x2={x} y2={y2} stroke="#9AA4AE" strokeWidth={2.4} strokeLinecap="round" />
      ))}
    </>
  )
}

function LedArt({ active, burned }: { active?: boolean | number; burned?: boolean }) {
  const lit = !burned && level(active) > 0
  const glow = level(active)
  const body = burned ? '#4A4A4A' : lit ? '#FF5252' : '#C62828'
  return (
    <g>
      {/* legs — anode long, cathode short, like the real part */}
      <line x1={54} y1={56} x2={54} y2={84} stroke="#9AA4AE" strokeWidth={2.4} strokeLinecap="round" />
      <line x1={70} y1={56} x2={70} y2={78} stroke="#9AA4AE" strokeWidth={2.4} strokeLinecap="round" />
      {/* glow halo */}
      {lit && (
        <circle cx={62} cy={34} r={26} fill="#FFB300" opacity={0.35 * glow} className="sim-glow" />
      )}
      {/* flange + dome */}
      <rect x={44} y={50} width={36} height={6} rx={2} fill={body} opacity={0.9} />
      <path
        d="M 46 50 L 46 32 A 16 16 0 0 1 78 32 L 78 50 Z"
        fill={body}
        opacity={burned ? 1 : 0.92}
      />
      {/* specular highlight, or a crack when burned */}
      {burned ? (
        <path d="M 56 26 L 62 36 L 58 44" fill="none" stroke="#1B1B1B" strokeWidth={1.6} />
      ) : (
        <path d="M 52 30 A 12 12 0 0 1 60 22" fill="none" stroke="white" strokeWidth={2.4} opacity={0.65} strokeLinecap="round" />
      )}
      {lit && <circle cx={62} cy={34} r={9} fill="#FFE082" opacity={0.85 * glow} />}
    </g>
  )
}

function ResistorArt() {
  return (
    <g>
      {/* leads bend down to the terminals */}
      <path d="M 26 42 L 14 42 L 14 70" fill="none" stroke="#9AA4AE" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M 98 42 L 110 42 L 110 70" fill="none" stroke="#9AA4AE" strokeWidth={2.4} strokeLinecap="round" />
      {/* body */}
      <rect x={26} y={32} width={72} height={20} rx={10} fill="#E8D5B0" stroke="#C9B189" strokeWidth={1} />
      {/* bands: red red brown gold = 220Ω */}
      <rect x={38} y={32} width={6} height={20} fill="#C62828" />
      <rect x={50} y={32} width={6} height={20} fill="#C62828" />
      <rect x={62} y={32} width={6} height={20} fill="#6D4C41" />
      <rect x={80} y={32} width={6} height={20} fill="#D4AF37" />
    </g>
  )
}

function ButtonArt({ active }: { active?: boolean | number }) {
  const pressed = level(active) > 0
  return (
    <g>
      <Legs xs={[44, 80]} y1={62} y2={84} />
      {/* tact switch base */}
      <rect x={36} y={22} width={52} height={42} rx={6} fill="#37474F" />
      <rect x={36} y={22} width={52} height={42} rx={6} fill="none" stroke="#263238" strokeWidth={1.5} />
      {/* corner contacts */}
      {[42, 82].map((x) =>
        [28, 58].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.5} fill="#B0BEC5" />),
      )}
      {/* plunger */}
      <circle cx={62} cy={43} r={pressed ? 11 : 13} fill={pressed ? '#C62828' : '#D32F2F'} />
      <circle cx={62} cy={43} r={pressed ? 11 : 13} fill="none" stroke="#8E0000" strokeWidth={1.5} />
      {pressed && <text x={62} y={14} textAnchor="middle" fontSize={9} fill="#1A7A4A" className="font-mono">click!</text>}
    </g>
  )
}

function BuzzerArt({ active }: { active?: boolean | number }) {
  const on = level(active) > 0
  return (
    <g className={on ? 'sim-buzzing' : undefined}>
      <Legs xs={[52, 72]} y1={64} y2={84} />
      <circle cx={62} cy={38} r={26} fill="#212121" />
      <circle cx={62} cy={38} r={26} fill="none" stroke="#000" strokeWidth={1.5} />
      <circle cx={62} cy={38} r={20} fill="none" stroke="#424242" strokeWidth={1} />
      <circle cx={62} cy={38} r={4} fill="#0D0D0D" stroke="#424242" strokeWidth={1} />
      <text x={84} y={18} fontSize={10} fill="#B0BEC5" className="font-mono">+</text>
      {on && (
        <g stroke="#E8720C" strokeWidth={2} fill="none" strokeLinecap="round">
          <path d="M 94 28 A 14 14 0 0 1 94 48" className="sim-glow" />
          <path d="M 101 22 A 22 22 0 0 1 101 54" className="sim-glow" opacity={0.6} />
        </g>
      )}
    </g>
  )
}

function Dht11Art() {
  return (
    <g>
      <Legs xs={[48, 62, 76]} y1={66} y2={84} />
      <rect x={38} y={10} width={48} height={58} rx={4} fill="#1E88E5" />
      <rect x={38} y={10} width={48} height={58} rx={4} fill="none" stroke="#1565C0" strokeWidth={1.5} />
      {/* vent grid */}
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect key={`${r}-${c}`} x={45 + c * 9} y={18 + r * 9} width={6} height={6} rx={1} fill="#0D47A1" />
        )),
      )}
      <text x={62} y={62} textAnchor="middle" fontSize={7} fill="#BBDEFB" className="font-mono">DHT11</text>
    </g>
  )
}

function HcSr04Art() {
  return (
    <g>
      <Legs xs={[38, 54, 70, 86]} y1={62} y2={84} />
      <rect x={14} y={16} width={96} height={48} rx={4} fill="#1565C0" />
      <rect x={14} y={16} width={96} height={48} rx={4} fill="none" stroke="#0D47A1" strokeWidth={1.5} />
      {/* the two ultrasonic "eyes" */}
      {[38, 86].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={40} r={17} fill="#B0BEC5" />
          <circle cx={cx} cy={40} r={17} fill="none" stroke="#78909C" strokeWidth={1.5} />
          <circle cx={cx} cy={40} r={10} fill="#37474F" />
          <circle cx={cx} cy={40} r={10} fill="none" stroke="#263238" strokeWidth={1} />
        </g>
      ))}
      {/* crystal */}
      <rect x={56} y={20} width={12} height={7} rx={3} fill="#CFD8DC" />
      <text x={62} y={58} textAnchor="middle" fontSize={6.5} fill="#BBDEFB" className="font-mono">HC-SR04</text>
    </g>
  )
}

function LdrArt() {
  return (
    <g>
      <Legs xs={[52, 72]} y1={56} y2={84} />
      <circle cx={62} cy={36} r={20} fill="#E0A458" />
      <circle cx={62} cy={36} r={20} fill="none" stroke="#B97E35" strokeWidth={2} />
      {/* the photoresistive zig-zag track */}
      <path
        d="M 48 28 H 76 M 48 34 H 76 M 48 40 H 76 M 48 46 H 70"
        stroke="#8C3B2E"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M 48 28 V 46 M 76 28 V 40" stroke="#8C3B2E" strokeWidth={2.6} strokeLinecap="round" />
    </g>
  )
}

function PirArt() {
  return (
    <g>
      <Legs xs={[48, 62, 76]} y1={68} y2={84} />
      <rect x={30} y={56} width={64} height={14} rx={3} fill="#1A7A4A" />
      {/* fresnel dome */}
      <circle cx={62} cy={38} r={25} fill="#F5F5F0" stroke="#D7D7CD" strokeWidth={1.5} />
      {/* facet lines */}
      <path d="M 41 30 A 26 26 0 0 1 83 30 M 39 42 A 30 30 0 0 1 85 42" fill="none" stroke="#DDDDD2" strokeWidth={1.2} />
      <path d="M 54 14 L 50 60 M 70 14 L 74 60" stroke="#DDDDD2" strokeWidth={1.2} fill="none" />
    </g>
  )
}

function PotArt({ active }: { active?: boolean | number }) {
  return (
    <g>
      <Legs xs={[44, 62, 80]} y1={64} y2={84} />
      <rect x={34} y={18} width={56} height={48} rx={6} fill="#1565C0" />
      <rect x={34} y={18} width={56} height={48} rx={6} fill="none" stroke="#0D47A1" strokeWidth={1.5} />
      {/* dial */}
      <circle cx={62} cy={42} r={16} fill="#ECEFF1" stroke="#B0BEC5" strokeWidth={1.5} />
      {/* cross-head slot */}
      <g stroke="#78909C" strokeWidth={2.4} strokeLinecap="round">
        <line x1={62} y1={32} x2={62} y2={52} />
        <line x1={52} y1={42} x2={72} y2={42} />
      </g>
    </g>
  )
}

function SoilArt() {
  return (
    <g>
      <Legs xs={[48, 62, 76]} y1={40} y2={84} />
      {/* header board */}
      <rect x={36} y={26} width={52} height={16} rx={3} fill="#1565C0" />
      {/* the two probe prongs */}
      <path d="M 48 26 L 48 4 A 4 4 0 0 1 56 4 L 56 26 Z" fill="#D4AF37" stroke="#B7791F" strokeWidth={1} />
      <path d="M 68 26 L 68 4 A 4 4 0 0 1 76 4 L 76 26 Z" fill="#D4AF37" stroke="#B7791F" strokeWidth={1} />
      <text x={62} y={38} textAnchor="middle" fontSize={6.5} fill="#BBDEFB" className="font-mono">SOIL</text>
    </g>
  )
}

export function ComponentArt({ componentId, active, burned }: ComponentArtProps) {
  switch (componentId) {
    case 'led':
      return <LedArt active={active} burned={burned} />
    case 'resistor-220':
      return <ResistorArt />
    case 'push-button':
      return <ButtonArt active={active} />
    case 'buzzer':
      return <BuzzerArt active={active} />
    case 'dht11':
      return <Dht11Art />
    case 'hc-sr04':
      return <HcSr04Art />
    case 'ldr':
      return <LdrArt />
    case 'pir':
      return <PirArt />
    case 'potentiometer':
      return <PotArt active={active} />
    case 'soil-moisture':
      return <SoilArt />
  }
}

/** Small standalone thumbnail used in the parts bin. */
export function ComponentThumb({ componentId, size = 56 }: { componentId: ComponentId; size?: number }) {
  return (
    <svg
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      width={size}
      height={(size * ART_H) / ART_W}
      aria-hidden
      className="pointer-events-none"
    >
      <ComponentArt componentId={componentId} />
    </svg>
  )
}
