// Shared contract for the Virtual Hardware Lab (Phase 1).
// Pure data types only — no React, no Supabase. The engine in /lib/simulator
// and the UI in /components/simulator both depend on this file, never on
// each other's internals.

// ---------------------------------------------------------------------------
// Boards
// ---------------------------------------------------------------------------

export type BoardId = 'arduino-uno' | 'esp32-devkit' | 'raspberry-pi-4'

/**
 * What a single board pin is electrically capable of. A physical pin may
 * carry several capabilities (e.g. ESP32 GPIO pins are digital + pwm +
 * sometimes analog-in).
 */
export type PinCapability =
  | 'digital'      // digital read/write
  | 'analog-in'    // ADC input
  | 'pwm'          // PWM output
  | 'power-3v3'    // 3.3V supply rail
  | 'power-5v'     // 5V supply rail
  | 'ground'
  | 'i2c-sda'
  | 'i2c-scl'
  | 'uart-tx'
  | 'uart-rx'

export interface PinDef {
  /** Stable identifier unique within the board, e.g. 'd13', 'gpio4', '5v-1' */
  id: string
  /** Silkscreen label shown to the student, e.g. 'D13', 'GPIO4', '5V' */
  label: string
  capabilities: PinCapability[]
  /** Which physical side of the board drawing the pin sits on */
  side: 'left' | 'right'
  /** 0-based position along its side, top to bottom */
  index: number
}

export interface BoardDef {
  id: BoardId
  name: string
  /** Logic-level voltage of GPIO pins — drives compatibility warnings */
  logicVoltage: 3.3 | 5
  /** Whether the board has a usable on-chip ADC (Raspberry Pi does not) */
  hasAnalogIn: boolean
  pins: PinDef[]
  /** One-line description shown in the board picker */
  description: string
  /** Short teaching notes shown alongside the workbench */
  teachingNotes: string[]
  /** Tailwind-compatible hex used to tint the board drawing */
  accentColor: string
}

// ---------------------------------------------------------------------------
// Components (sensors / actuators / passives)
// ---------------------------------------------------------------------------

export type ComponentId =
  | 'led'
  | 'resistor-220'
  | 'push-button'
  | 'buzzer'
  | 'dht11'          // temperature + humidity
  | 'hc-sr04'        // ultrasonic distance
  | 'ldr'            // light-dependent resistor
  | 'pir'            // motion
  | 'potentiometer'
  | 'soil-moisture'

export type ComponentCategory = 'sensor' | 'actuator' | 'passive' | 'input'

/**
 * Electrical role of a component terminal. Validation matches roles against
 * the pin capabilities they may legally connect to.
 */
export type TerminalRole =
  | 'vcc'          // must reach a power pin (within voltage range)
  | 'gnd'          // must reach a ground pin
  | 'digital-out'  // component drives a signal → board digital/analog-in pin
  | 'digital-in'   // component listens → board digital/pwm pin
  | 'analog-out'   // component drives an analog level → board analog-in pin
  | 'passive'      // resistor legs etc. — connects in series anywhere

export interface TerminalDef {
  /** Stable identifier unique within the component, e.g. 'anode', 'trig' */
  id: string
  label: string
  role: TerminalRole
}

export interface SimulatedReadingDef {
  /** e.g. '°C', 'cm', '%', 'lux' */
  unit: string
  min: number
  max: number
  /** Human label for the reading, e.g. 'Temperature' */
  label: string
}

export interface ComponentDef {
  id: ComponentId
  name: string
  category: ComponentCategory
  terminals: TerminalDef[]
  /** Supply voltage range the part tolerates, in volts */
  minVoltage: number
  maxVoltage: number
  /** LEDs need a series resistor — validation enforces this when true */
  requiresSeriesResistor?: boolean
  description: string
  /** What the fake simulator reports for this part (sensors only) */
  readings?: SimulatedReadingDef[]
  /** Short emoji/glyph used in the palette, kept ASCII-safe in code */
  glyph: string
}

// ---------------------------------------------------------------------------
// Circuit state (what the student has placed on the workbench)
// ---------------------------------------------------------------------------

export interface PlacedComponent {
  /** Unique per placement — one ComponentId can be placed many times */
  instanceId: string
  componentId: ComponentId
  /** Workbench position in SVG user units */
  x: number
  y: number
}

/** One end of a wire: either a board pin or a component terminal. */
export type WireEnd =
  | { kind: 'board'; pinId: string }
  | { kind: 'component'; instanceId: string; terminalId: string }

export interface Wire {
  id: string
  from: WireEnd
  to: WireEnd
}

export interface Circuit {
  boardId: BoardId
  components: PlacedComponent[]
  wires: Wire[]
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type IssueSeverity = 'error' | 'warning' | 'info'

/**
 * Machine-readable cause of a validation issue. The UI uses this to pick a
 * physical failure effect (smoke, spark, dead part…) and the matching lesson
 * in lib/simulator/failure-lessons.ts when the student runs a broken circuit.
 */
export type FailureCode =
  | 'short-circuit'      // power rail wired straight to ground
  | 'missing-resistor'   // LED with no series resistor
  | 'overvoltage'        // supply rail exceeds the part's max voltage
  | 'undervoltage'       // supply rail below the part's min voltage
  | 'no-power'           // vcc terminal never reaches a power pin
  | 'no-ground'          // gnd terminal never reaches a ground pin
  | 'floating-signal'    // data terminal connected to nothing
  | 'signal-short'       // data terminal wired straight to power/ground
  | 'analog-on-digital'  // analog output on a pin with no ADC
  | 'no-adc-on-board'    // analog sensor on a board with no ADC at all (the Pi)
  | 'pin-conflict'       // two data signals share one board pin
  | 'not-wired'          // part on the bench with no wires yet

export interface ValidationIssue {
  severity: IssueSeverity
  message: string
  /** Machine-readable cause — anchors the failure animation + lesson */
  code?: FailureCode
  /** Optional anchors so the UI can highlight the offending element */
  wireId?: string
  instanceId?: string
  pinId?: string
}

export interface ValidationResult {
  /** true when there are no error-severity issues (warnings allowed) */
  ok: boolean
  issues: ValidationIssue[]
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface SensorReading {
  instanceId: string
  label: string
  value: number
  unit: string
}

export interface SerialLine {
  /** Simulation tick the line was emitted on */
  tick: number
  text: string
}

/** Snapshot of the simulated world at one tick. */
export interface SimulationFrame {
  tick: number
  readings: SensorReading[]
  /**
   * Actuator visual state keyed by instanceId:
   * LEDs/buzzers → boolean on/off, PWM-driven parts → 0..1 level.
   */
  actuatorStates: Record<string, boolean | number>
  /** New serial-monitor lines produced during this tick */
  serial: SerialLine[]
}
