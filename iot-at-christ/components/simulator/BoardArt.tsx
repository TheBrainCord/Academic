import type { BoardDef } from '@/types/simulator'

// Stylised-but-recognisable PCB drawings for the three boards. BoardCanvas
// draws the interactive pins on top; this file only paints the hardware so
// the bench reads like a photo of a real dev board, not an abstract box.

// Shared workbench geometry — BoardCanvas imports these so pins, art and
// wires all agree on coordinates.
export const VIEW_W = 880
export const VIEW_H = 560
export const BOARD_X = 36
export const BOARD_Y = 22
export const BOARD_W = 232
export const BOARD_H = 516
/** Pin columns sit just inside the PCB edges, on the header strips. */
export const PIN_LEFT_X = BOARD_X + 22
export const PIN_RIGHT_X = BOARD_X + BOARD_W - 22

const CX = BOARD_X + BOARD_W / 2

interface BoardArtProps {
  board: BoardDef
  /** Simulation currently running — lights the power LED */
  running: boolean
  /** A short circuit killed the supply — power LED goes dark */
  shorted: boolean
}

function HeaderStrips() {
  return (
    <>
      <rect x={PIN_LEFT_X - 10} y={BOARD_Y + 8} width={20} height={BOARD_H - 16} rx={4} fill="#16181C" />
      <rect x={PIN_RIGHT_X - 10} y={BOARD_Y + 8} width={20} height={BOARD_H - 16} rx={4} fill="#16181C" />
    </>
  )
}

function MountingHoles({ color }: { color: string }) {
  const r = 5
  const inset = 11
  const pts = [
    [BOARD_X + inset, BOARD_Y + inset],
    [BOARD_X + BOARD_W - inset, BOARD_Y + inset],
    [BOARD_X + inset, BOARD_Y + BOARD_H - inset],
    [BOARD_X + BOARD_W - inset, BOARD_Y + BOARD_H - inset],
  ]
  return (
    <>
      {pts.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={r} fill="#F7F8FA" />
          <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={1.5} />
        </g>
      ))}
    </>
  )
}

function PowerLed({ x, y, running, shorted }: { x: number; y: number; running: boolean; shorted: boolean }) {
  const on = running && !shorted
  return (
    <g>
      {on && <circle cx={x} cy={y} r={8} fill="#69F0AE" opacity={0.4} className="sim-glow" />}
      <circle cx={x} cy={y} r={3.5} fill={on ? '#69F0AE' : '#1B3A2A'} stroke="#0F2418" strokeWidth={0.8} />
      <text x={x} y={y + 13} textAnchor="middle" fontSize={7} fill="white" opacity={0.8} className="font-mono">
        {shorted ? 'PWR ✗' : 'PWR'}
      </text>
    </g>
  )
}

function ArduinoUnoArt({ running, shorted }: { running: boolean; shorted: boolean }) {
  const chipX = CX - 21
  const chipY = BOARD_Y + 330
  return (
    <g>
      <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_H} rx={12} fill="#00878F" stroke="#00666D" strokeWidth={2} />
      <MountingHoles color="#00666D" />
      <HeaderStrips />

      {/* USB-B jack (overhangs the top edge, like the real thing) */}
      <rect x={CX - 52} y={BOARD_Y - 8} width={48} height={40} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1.5} />
      <rect x={CX - 46} y={BOARD_Y - 2} width={36} height={28} rx={2} fill="#AEB6BE" />
      <text x={CX - 28} y={BOARD_Y + 44} textAnchor="middle" fontSize={7} fill="white" opacity={0.75} className="font-mono">USB</text>

      {/* Barrel power jack */}
      <rect x={CX + 8} y={BOARD_Y - 4} width={36} height={32} rx={4} fill="#16181C" stroke="#000" strokeWidth={1} />
      <circle cx={CX + 26} cy={BOARD_Y + 12} r={7} fill="#2A2D33" stroke="#000" strokeWidth={1} />
      <circle cx={CX + 26} cy={BOARD_Y + 12} r={2.5} fill="#0A0A0A" />

      {/* Reset button */}
      <rect x={CX - 50} y={BOARD_Y + 56} width={22} height={18} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <circle cx={CX - 39} cy={BOARD_Y + 65} r={5} fill="#D32F2F" />

      {/* Power + L LEDs */}
      <PowerLed x={CX + 30} y={BOARD_Y + 64} running={running} shorted={shorted} />
      <circle cx={CX + 2} cy={BOARD_Y + 62} r={3} fill={running && !shorted ? '#FFD54F' : '#3E3413'} />
      <text x={CX + 2} y={BOARD_Y + 75} textAnchor="middle" fontSize={7} fill="white" opacity={0.8} className="font-mono">L</text>

      {/* Silkscreen branding */}
      <text
        x={CX}
        y={BOARD_Y + 190}
        textAnchor="middle"
        fontSize={22}
        fill="white"
        opacity={0.92}
        className="font-display font-bold"
        transform={`rotate(-90 ${CX} ${BOARD_Y + 190})`}
      >
        ARDUINO
      </text>
      <text x={CX} y={BOARD_Y + 268} textAnchor="middle" fontSize={12} fill="white" opacity={0.8} className="font-mono">
        UNO R3
      </text>

      {/* 16 MHz crystal */}
      <rect x={CX - 44} y={BOARD_Y + 292} width={30} height={13} rx={6} fill="#CFD8DC" stroke="#90A4AE" strokeWidth={1} />
      <text x={CX - 29} y={BOARD_Y + 301} textAnchor="middle" fontSize={6} fill="#455A64" className="font-mono">16MHz</text>

      {/* ATmega328P DIP-28 */}
      <rect x={chipX} y={chipY} width={42} height={128} rx={3} fill="#16181C" stroke="#000" strokeWidth={1} />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x={chipX - 5} y={chipY + 10 + i * 15} width={5} height={5} fill="#9AA4AE" />
          <rect x={chipX + 42} y={chipY + 10 + i * 15} width={5} height={5} fill="#9AA4AE" />
        </g>
      ))}
      <path d={`M ${chipX + 14} ${chipY} A 7 7 0 0 0 ${chipX + 28} ${chipY}`} fill="#2A2D33" />
      <text
        x={chipX + 21}
        y={chipY + 64}
        textAnchor="middle"
        fontSize={8}
        fill="#B0BEC5"
        className="font-mono"
        transform={`rotate(-90 ${chipX + 21} ${chipY + 64})`}
      >
        ATMEGA328P
      </text>

      {/* ICSP header */}
      {[0, 1, 2].map((c) =>
        [0, 1].map((r) => (
          <circle key={`${c}-${r}`} cx={CX - 8 + c * 12} cy={BOARD_Y + 478 + r * 12} r={3.4} fill="#D4AF37" stroke="#8C6D1F" strokeWidth={1} />
        )),
      )}
    </g>
  )
}

function Esp32Art({ running, shorted }: { running: boolean; shorted: boolean }) {
  const shieldY = BOARD_Y + 96
  return (
    <g>
      <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_H} rx={12} fill="#26282E" stroke="#101114" strokeWidth={2} />
      <MountingHoles color="#101114" />
      <HeaderStrips />

      {/* PCB meander antenna at the top */}
      <rect x={CX - 56} y={BOARD_Y + 10} width={112} height={66} rx={6} fill="#1B1D22" stroke="#101114" strokeWidth={1} />
      <path
        d={`M ${CX - 44} ${BOARD_Y + 62} V ${BOARD_Y + 22} H ${CX - 26} V ${BOARD_Y + 56} H ${CX - 8} V ${BOARD_Y + 22} H ${CX + 10} V ${BOARD_Y + 56} H ${CX + 28} V ${BOARD_Y + 22} H ${CX + 46} V ${BOARD_Y + 62}`}
        fill="none"
        stroke="#D4AF37"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <text x={CX} y={BOARD_Y + 88} textAnchor="middle" fontSize={7} fill="#B0BEC5" className="font-mono">2.4GHz Wi-Fi · BT</text>

      {/* RF shield can */}
      <rect x={CX - 58} y={shieldY} width={116} height={132} rx={5} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1.5} />
      <rect x={CX - 50} y={shieldY + 8} width={100} height={116} rx={3} fill="none" stroke="#AEB6BE" strokeWidth={1} />
      <text x={CX} y={shieldY + 58} textAnchor="middle" fontSize={9} fill="#5B6770" className="font-mono">ESP32</text>
      <text x={CX} y={shieldY + 72} textAnchor="middle" fontSize={8} fill="#5B6770" className="font-mono">WROOM-32</text>

      {/* Power LED + silk */}
      <PowerLed x={CX - 40} y={shieldY + 158} running={running} shorted={shorted} />
      <text x={CX + 16} y={shieldY + 162} textAnchor="middle" fontSize={9} fill="#B0BEC5" className="font-mono">DevKit v1</text>

      {/* Passives sprinkled like the real board */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={CX - 44 + i * 24} y={shieldY + 178} width={12} height={6} rx={1} fill={i % 2 ? '#6D4C41' : '#37474F'} />
      ))}

      {/* EN / BOOT buttons */}
      <rect x={CX - 56} y={BOARD_Y + 446} width={26} height={20} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <text x={CX - 43} y={BOARD_Y + 480} textAnchor="middle" fontSize={7} fill="#B0BEC5" className="font-mono">EN</text>
      <rect x={CX + 30} y={BOARD_Y + 446} width={26} height={20} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <text x={CX + 43} y={BOARD_Y + 480} textAnchor="middle" fontSize={7} fill="#B0BEC5" className="font-mono">BOOT</text>

      {/* Micro-USB (overhangs the bottom edge) */}
      <rect x={CX - 16} y={BOARD_Y + BOARD_H - 14} width={32} height={22} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1.5} />
      <rect x={CX - 10} y={BOARD_Y + BOARD_H - 8} width={20} height={10} rx={2} fill="#AEB6BE" />
    </g>
  )
}

function RaspberryPiArt({ running, shorted }: { running: boolean; shorted: boolean }) {
  const socY = BOARD_Y + 150
  return (
    <g>
      <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_H} rx={12} fill="#1B6E3C" stroke="#14542E" strokeWidth={2} />
      <MountingHoles color="#14542E" />
      <HeaderStrips />

      {/* Raspberry silhouette + name */}
      <g transform={`translate(${CX} ${BOARD_Y + 60})`} fill="#E8F5E9" opacity={0.9}>
        <circle cx={-7} cy={0} r={9} />
        <circle cx={7} cy={0} r={9} />
        <circle cx={0} cy={10} r={9} />
        <path d="M -8 -12 Q -4 -20 0 -12 Q 4 -20 8 -12 Q 2 -8 0 -10 Q -2 -8 -8 -12" />
      </g>
      <text x={CX} y={BOARD_Y + 96} textAnchor="middle" fontSize={10} fill="white" opacity={0.9} className="font-mono">
        Raspberry Pi 4
      </text>
      <text x={CX} y={BOARD_Y + 110} textAnchor="middle" fontSize={7.5} fill="white" opacity={0.65} className="font-mono">
        Model B · 4GB
      </text>

      {/* BCM2711 SoC */}
      <rect x={CX - 34} y={socY} width={68} height={68} rx={4} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1.5} />
      <rect x={CX - 26} y={socY + 8} width={52} height={52} rx={2} fill="#AEB6BE" />
      <text x={CX} y={socY + 38} textAnchor="middle" fontSize={8} fill="#5B6770" className="font-mono">BCM2711</text>

      {/* LPDDR4 RAM */}
      <rect x={CX - 30} y={socY + 88} width={60} height={42} rx={3} fill="#16181C" stroke="#000" strokeWidth={1} />
      <text x={CX} y={socY + 113} textAnchor="middle" fontSize={7} fill="#B0BEC5" className="font-mono">LPDDR4</text>

      {/* Power + ACT LEDs */}
      <PowerLed x={CX - 28} y={socY + 158} running={running} shorted={shorted} />
      <circle cx={CX + 14} cy={socY + 156} r={3} fill={running && !shorted ? '#69F0AE' : '#1B3A2A'} className={running && !shorted ? 'sim-flicker' : undefined} />
      <text x={CX + 14} y={socY + 171} textAnchor="middle" fontSize={7} fill="white" opacity={0.8} className="font-mono">ACT</text>

      {/* micro-HDMI ×2 + USB-C along the bottom */}
      <rect x={CX - 56} y={BOARD_Y + BOARD_H - 30} width={30} height={18} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <rect x={CX - 14} y={BOARD_Y + BOARD_H - 30} width={30} height={18} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <rect x={CX + 28} y={BOARD_Y + BOARD_H - 30} width={26} height={18} rx={6} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <text x={CX - 12} y={BOARD_Y + BOARD_H - 38} textAnchor="middle" fontSize={6.5} fill="white" opacity={0.7} className="font-mono">HDMI · HDMI · PWR</text>
    </g>
  )
}

function NodeMcuArt({ running, shorted }: { running: boolean; shorted: boolean }) {
  const shieldY = BOARD_Y + 70
  return (
    <g>
      <rect x={BOARD_X} y={BOARD_Y} width={BOARD_W} height={BOARD_H} rx={12} fill="#0F9D58" stroke="#0B7A43" strokeWidth={2} />
      <MountingHoles color="#0B7A43" />
      <HeaderStrips />

      {/* ESP8266 module + antenna trace */}
      <rect x={CX - 52} y={shieldY} width={104} height={92} rx={5} fill="#1B1D22" stroke="#101114" strokeWidth={1.5} />
      <path
        d={`M ${CX - 40} ${shieldY + 70} V ${shieldY + 30} H ${CX - 22} V ${shieldY + 64} H ${CX - 4} V ${shieldY + 30} H ${CX + 14} V ${shieldY + 64} H ${CX + 32} V ${shieldY + 30}`}
        fill="none"
        stroke="#D4AF37"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text x={CX} y={shieldY + 86} textAnchor="middle" fontSize={8} fill="#B0BEC5" className="font-mono">ESP-12E</text>

      {/* Branding */}
      <text
        x={CX}
        y={BOARD_Y + 230}
        textAnchor="middle"
        fontSize={20}
        fill="white"
        opacity={0.92}
        className="font-display font-bold"
        transform={`rotate(-90 ${CX} ${BOARD_Y + 230})`}
      >
        NodeMCU
      </text>
      <text x={CX} y={shieldY + 200} textAnchor="middle" fontSize={9} fill="white" opacity={0.75} className="font-mono">
        ESP8266 · Wi-Fi
      </text>

      {/* Power LED + silk */}
      <PowerLed x={CX - 44} y={shieldY + 112} running={running} shorted={shorted} />
      <circle cx={CX + 44} cy={shieldY + 110} r={3} fill={running && !shorted ? '#69F0AE' : '#1B3A2A'} className={running && !shorted ? 'sim-flicker' : undefined} />

      {/* CP2102 USB-serial chip */}
      <rect x={CX - 18} y={BOARD_Y + 380} width={36} height={20} rx={2} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <text x={CX} y={BOARD_Y + 393} textAnchor="middle" fontSize={6.5} fill="#5B6770" className="font-mono">CP2102</text>

      {/* FLASH / RST buttons */}
      <rect x={CX - 56} y={BOARD_Y + 446} width={26} height={20} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <text x={CX - 43} y={BOARD_Y + 480} textAnchor="middle" fontSize={7} fill="#B0BEC5" className="font-mono">FLASH</text>
      <rect x={CX + 30} y={BOARD_Y + 446} width={26} height={20} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1} />
      <text x={CX + 43} y={BOARD_Y + 480} textAnchor="middle" fontSize={7} fill="#B0BEC5" className="font-mono">RST</text>

      {/* Micro-USB (overhangs the bottom edge) */}
      <rect x={CX - 16} y={BOARD_Y + BOARD_H - 14} width={32} height={22} rx={3} fill="#C9CED4" stroke="#9AA4AE" strokeWidth={1.5} />
      <rect x={CX - 10} y={BOARD_Y + BOARD_H - 8} width={20} height={10} rx={2} fill="#AEB6BE" />
    </g>
  )
}

/** Small standalone board thumbnail used in the controller picker. */
export function BoardThumb({ board, size = 64 }: { board: BoardDef; size?: number }) {
  return (
    <svg
      viewBox={`${BOARD_X - 10} ${BOARD_Y - 14} ${BOARD_W + 20} ${BOARD_H + 28}`}
      width={(size * (BOARD_W + 20)) / (BOARD_H + 28)}
      height={size}
      aria-hidden
      className="pointer-events-none"
    >
      <BoardArt board={board} running={false} shorted={false} />
    </svg>
  )
}

export function BoardArt({ board, running, shorted }: BoardArtProps) {
  switch (board.id) {
    case 'arduino-uno':
      return <ArduinoUnoArt running={running} shorted={shorted} />
    case 'esp32-devkit':
      return <Esp32Art running={running} shorted={shorted} />
    case 'raspberry-pi-4':
      return <RaspberryPiArt running={running} shorted={shorted} />
    case 'nodemcu-esp8266':
      return <NodeMcuArt running={running} shorted={shorted} />
  }
}
