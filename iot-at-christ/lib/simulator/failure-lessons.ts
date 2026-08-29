import type { FailureCode, ValidationIssue } from '@/types/simulator'

// The Virtual Lab teaches the way real benches do: let the student run a
// broken circuit, show the consequence (smoke, sparks, a dead sensor), and
// only THEN explain the mistake. Each failure code maps to one lesson card
// plus the visual/serial drama the workbench plays out.

/** Which animation the canvas plays on the offending part/wire. */
export type FailureEffect =
  | 'spark'   // bright flash — shorts
  | 'smoke'   // grey wisps — burning parts
  | 'burnout' // smoke, then the part goes dark for good
  | 'dead'    // part simply never responds
  | 'flicker' // unreliable, stuttering behaviour
  | 'glitch'  // garbage data
  | 'none'

export interface FailureLesson {
  code: FailureCode
  /** Short dramatic headline, e.g. "💥 Short circuit!" */
  headline: string
  /** What the student just watched happen on the bench */
  whatYouSaw: string
  /** The physics/electronics behind it, in friendly terms */
  why: string
  /** Concrete fix the student can apply right now */
  fix: string
  /** What this same mistake does to real hardware */
  onRealHardware: string
  effect: FailureEffect
  /** Lines the serial monitor prints when this failure fires */
  serialDrama: string[]
}

export const FAILURE_LESSONS: Record<FailureCode, FailureLesson> = {
  'short-circuit': {
    code: 'short-circuit',
    headline: '💥 Short circuit!',
    whatYouSaw:
      'A spark jumped from the wire, the board’s power LED died, and everything went silent.',
    why:
      'You wired a power pin straight to ground. With no component in between there is nothing to resist the current, so it spikes as high as the supply allows — Ohm’s law with R ≈ 0. The board’s voltage regulator collapses trying to feed it.',
    fix:
      'Delete the wire that joins the power pin to the GND pin. Power and ground should only ever meet through a component.',
    onRealHardware:
      'Best case: the board’s polyfuse trips and it reboots. Worst case: the regulator chip overheats and the board is dead. USB ports have been killed this way.',
    effect: 'spark',
    serialDrama: [
      '*** FZZT ***',
      'BROWNOUT DETECTED — supply rail collapsed',
      'Board resetting............ no response',
    ],
  },
  'missing-resistor': {
    code: 'missing-resistor',
    headline: '🔥 LED burned out!',
    whatYouSaw:
      'The LED flashed painfully bright for an instant, let out a wisp of smoke, and went dark forever.',
    why:
      'A conducting LED has almost no resistance of its own. Without a series resistor the current runs away — tens of times the LED’s 20mA rating — and the tiny junction inside melts. That bright flash was the junction’s last act.',
    fix:
      'Put the 220Ω resistor in series: pin → resistor → LED anode, then cathode → GND. Either resistor leg can face either way.',
    onRealHardware:
      'Real LEDs die exactly like this — sometimes with a tiny pop. The classic giveaway smell of a fried part is the first thing every electronics teacher learns to recognise.',
    effect: 'burnout',
    serialDrama: [
      '[LED] current 280mA — rating is 20mA!',
      '*** POP *** junction failure',
      '[LED] no longer responding',
    ],
  },
  overvoltage: {
    code: 'overvoltage',
    headline: '🔥 Part cooked by overvoltage!',
    whatYouSaw:
      'The component heated up, smoked, and stopped responding — permanently.',
    why:
      'You fed the part more volts than its datasheet allows. Inside a chip, every transistor is built for a maximum voltage; push past it and the insulation layers break down like an over-inflated balloon.',
    fix:
      'Move the VCC wire to a lower rail (3.3V instead of 5V), or pick a part rated for the voltage you have.',
    onRealHardware:
      'This is the single most common way beginners kill 3.3V sensors and the ESP32/Raspberry Pi GPIO. The damage is silent, instant and irreversible.',
    effect: 'smoke',
    serialDrama: [
      'WARNING: supply exceeds absolute maximum rating',
      '*** ssssss *** thermal runaway',
      'Device not found on bus',
    ],
  },
  undervoltage: {
    code: 'undervoltage',
    headline: '🥱 Brown-out — not enough volts',
    whatYouSaw:
      'The part sort of worked: readings stuttered, dropped out, came back wrong.',
    why:
      'The supply rail is below the part’s minimum operating voltage. Its internal logic sits right at the edge of switching on, so it behaves unpredictably — the hardest kind of bug to find because it half works.',
    fix:
      'Move the VCC wire to a higher rail this part is rated for (e.g. 5V instead of 3.3V).',
    onRealHardware:
      'Undervoltage rarely damages anything, but it causes the flakiest field failures in IoT — sensors that work on the bench and fail on battery power at 2am.',
    effect: 'flicker',
    serialDrama: [
      '[sensor] checksum error',
      '[sensor] timeout... retrying',
      '[sensor] reading unstable — supply voltage low?',
    ],
  },
  'no-power': {
    code: 'no-power',
    headline: '😶 Nothing happened — no power',
    whatYouSaw:
      'You pressed Run and the part just sat there. No readings, no light, no sound.',
    why:
      'The component’s VCC terminal never reaches a power pin, so no current can flow through it. Electronics 101: every part needs a complete loop — power in, ground out.',
    fix:
      'Wire the part’s VCC terminal to a power pin (5V or 3.3V — check the part’s rating first).',
    onRealHardware:
      'Harmless but maddening — “why is my sensor dead?” is answered by a missing power wire more often than any other cause. Always check power first.',
    effect: 'dead',
    serialDrama: ['[sensor] init failed — no response from device'],
  },
  'no-ground': {
    code: 'no-ground',
    headline: '😶 Open circuit — no path to ground',
    whatYouSaw:
      'Dead silence. Power was connected, but the part still did absolutely nothing.',
    why:
      'Current must flow in a loop: from the power pin, through the component, back to ground. With no ground wire the loop is open — like a bridge with the far half missing. Voltage is present, but no current can flow.',
    fix: 'Wire the part’s GND terminal to any GND pin on the board.',
    onRealHardware:
      'The #1 breadboard bug in every first-year lab. Real circuits also pick up wild noise when grounds are missing or shared badly — “ground problems” haunt even professionals.',
    effect: 'dead',
    serialDrama: ['[sensor] init failed — check wiring (open circuit?)'],
  },
  'floating-signal': {
    code: 'floating-signal',
    headline: '👻 Floating signal — random garbage',
    whatYouSaw:
      'The part was powered, but its data never arrived — or arrived as random nonsense.',
    why:
      'The signal terminal isn’t wired to any board pin, so its voltage just floats, picking up electrical noise from the air like an antenna. The board reads static, not data.',
    fix:
      'Wire the data/signal terminal to a GPIO pin so the board can actually read or drive it.',
    onRealHardware:
      'Floating inputs flip randomly with nearby Wi-Fi, your hand, even the room lights. That’s why real designs add pull-up/pull-down resistors to force a known level.',
    effect: 'glitch',
    serialDrama: [
      '[signal] 0x?? 0x?? 0x?? — noise',
      '[signal] no valid data on pin (floating input?)',
    ],
  },
  'signal-short': {
    code: 'signal-short',
    headline: '⚡ Signal pin shorted to a rail!',
    whatYouSaw:
      'A spark from the signal wire — the pin fought the power rail and lost.',
    why:
      'A data terminal was wired straight to power or ground. The moment the pin tries to output the opposite level, two stiff voltage sources fight each other and a huge current flows through the chip’s tiny output transistor.',
    fix:
      'Move the signal wire to a GPIO pin. Only VCC terminals belong on power pins, only GND terminals on ground pins.',
    onRealHardware:
      'This kills individual GPIO pins — the board survives, but that pin never works again. Many “mystery dead pins” on student Arduinos died exactly this way.',
    effect: 'spark',
    serialDrama: [
      '*** CRACK ***',
      'GPIO driver over-current — pin disabled',
    ],
  },
  'analog-on-digital': {
    code: 'analog-on-digital',
    headline: '🤷 Analog signal on a digital-only pin',
    whatYouSaw:
      'The sensor was alive, but readings jumped between 0 and a meaningless max — nothing in between.',
    why:
      'An analog signal is a smooth voltage between 0V and VCC. A digital-only pin can only answer one question: above or below the threshold? All the in-between information is thrown away.',
    fix:
      'Move the wire to an analog-in pin (A0–A5 on the Uno, the ADC-capable GPIOs on the ESP32).',
    onRealHardware:
      'No damage — just useless data. Knowing which pins have an ADC behind them is a real skill: on most boards only a few do.',
    effect: 'glitch',
    serialDrama: [
      '[analog] reading: 0',
      '[analog] reading: 1',
      '[analog] reading: 0   ← only two values? wrong pin type',
    ],
  },
  'no-adc-on-board': {
    code: 'no-adc-on-board',
    headline: '🚫 The Pi can’t read analog. At all.',
    whatYouSaw:
      'Whatever pin you tried, the analog sensor’s output never produced a reading.',
    why:
      'The Raspberry Pi famously ships with no ADC (analog-to-digital converter) — its GPIO pins are purely digital. The smooth voltage from your sensor has no hardware that can measure it.',
    fix:
      'Either add an external ADC chip (the MCP3008 is the classic) or switch to a board with analog pins — the Arduino Uno or ESP32.',
    onRealHardware:
      'This catch surprises every Pi beginner. It’s also why the Pi pairs so often with an Arduino: the Arduino reads the analog world, the Pi does the thinking.',
    effect: 'dead',
    serialDrama: ['[adc] ERROR: no ADC peripheral on this board'],
  },
  'pin-conflict': {
    code: 'pin-conflict',
    headline: '🎭 Two signals fighting over one pin',
    whatYouSaw:
      'Both parts misbehaved — readings interleaved into nonsense, outputs stuttered.',
    why:
      'Two data signals share a single board pin. The pin can only carry one conversation at a time; two talkers on one line corrupt each other, like two people on one phone call.',
    fix: 'Give each data signal its own GPIO pin.',
    onRealHardware:
      'If both parts drive the line, currents fight and pins can be damaged. Buses like I2C solve this properly — that’s why they have an addressing protocol.',
    effect: 'glitch',
    serialDrama: [
      '[bus] collision detected on shared pin',
      '[bus] data corrupted',
    ],
  },
  'unsupported-pin-direction': {
    code: 'unsupported-pin-direction',
    headline: '↪️ This pin only works the other way',
    whatYouSaw: 'The connected actuator did not respond because the selected pin cannot drive it.',
    why: 'Some GPIO pins are input-only. They can measure a sensor signal, but have no output driver transistor to source or sink an actuator current.',
    fix: 'Move the actuator signal to a bidirectional GPIO or digital-output pin. Keep input-only pins for sensors.',
    onRealHardware: 'This does not normally cause damage; the output simply never changes because the hardware driver does not exist.',
    effect: 'dead',
    serialDrama: ['[gpio] ERROR: selected pin is input-only'],
  },
  'pin-caution': {
    code: 'pin-caution',
    headline: '⚠️ Usable pin with a startup caveat',
    whatYouSaw: 'The circuit remains valid, but the simulator highlighted a pin that has a special role while the board resets.',
    why: 'Boot-strapping pins are sampled during reset to configure the chip. They become normal GPIO after startup, provided attached hardware did not force the wrong startup level.',
    fix: 'Use the pin with suitable pull resistors, or move the signal to an ordinary GPIO if the attached module might hold it at the wrong level during reset.',
    onRealHardware: 'A wrong strap level usually prevents booting rather than damaging the chip. Correcting the wiring restores normal operation.',
    effect: 'none',
    serialDrama: [],
  },
  'not-wired': {
    code: 'not-wired',
    headline: 'Part not wired yet',
    whatYouSaw: 'The part sat on the bench doing nothing.',
    why: 'It has no wires, so it isn’t part of the circuit at all.',
    fix: 'Tap one of its terminals, then tap a board pin to run a wire.',
    onRealHardware: 'A part in the parts drawer does nothing either.',
    effect: 'none',
    serialDrama: [],
  },
  ...Object.fromEntries(([
    'logic-overvoltage', 'input-only-output', 'direct-load-drive', 'inductive-protection',
    'rail-overload', 'missing-common-ground', 'missing-pull-up', 'pwm-incompatible',
    'duplicate-pin-role', 'i2c-address-conflict',
  ] as FailureCode[]).map((code) => [code, {
    code,
    headline: 'Electrical compatibility warning',
    whatYouSaw: 'The circuit did not behave safely or predictably.',
    why: 'The connection violates an electrical limit or interface requirement described by the validation warning.',
    fix: 'Follow the warning’s concrete wiring remedy before powering real hardware.',
    onRealHardware: 'Ignoring electrical limits can cause corrupted readings, resets, overheating, or permanent damage.',
    effect: 'glitch' as const,
    serialDrama: ['[safety] incompatible electrical connection detected'],
  }])) as Record<Exclude<FailureCode,
    | 'short-circuit' | 'missing-resistor' | 'overvoltage' | 'undervoltage'
    | 'no-power' | 'no-ground' | 'floating-signal' | 'signal-short'
    | 'analog-on-digital' | 'no-adc-on-board' | 'pin-conflict' | 'not-wired'
  >, FailureLesson>,
}

export function getLesson(code: FailureCode): FailureLesson {
  return FAILURE_LESSONS[code]
}

/**
 * The error-severity lessons triggered by a circuit, deduplicated by code and
 * keeping the first issue per code so the UI can anchor highlights.
 */
export interface TriggeredFailure {
  lesson: FailureLesson
  issue: ValidationIssue
}

export function triggeredFailures(issues: ValidationIssue[]): TriggeredFailure[] {
  const seen = new Set<FailureCode>()
  const out: TriggeredFailure[] = []
  for (const issue of issues) {
    if (issue.severity !== 'error' || !issue.code) continue
    if (seen.has(issue.code)) continue
    seen.add(issue.code)
    out.push({ lesson: FAILURE_LESSONS[issue.code], issue })
  }
  return out
}

/**
 * Failure effect per placed component (instanceId) and per wire (wireId),
 * so the canvas knows where to draw smoke and sparks.
 */
export function failureEffectMap(issues: ValidationIssue[]): {
  byInstance: Record<string, FailureEffect>
  byWire: Record<string, FailureEffect>
} {
  const byInstance: Record<string, FailureEffect> = {}
  const byWire: Record<string, FailureEffect> = {}
  // Dramatic effects win over quiet ones when a part has several problems.
  const rank: Record<FailureEffect, number> = {
    spark: 5, burnout: 4, smoke: 3, glitch: 2, flicker: 2, dead: 1, none: 0,
  }
  for (const issue of issues) {
    if (issue.severity !== 'error' || !issue.code) continue
    const effect = FAILURE_LESSONS[issue.code].effect
    if (issue.instanceId) {
      const prev = byInstance[issue.instanceId]
      if (!prev || rank[effect] > rank[prev]) byInstance[issue.instanceId] = effect
    }
    if (issue.wireId) {
      const prev = byWire[issue.wireId]
      if (!prev || rank[effect] > rank[prev]) byWire[issue.wireId] = effect
    }
  }
  return { byInstance, byWire }
}
