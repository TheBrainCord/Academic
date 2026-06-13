import type { Circuit, ComponentDef, PinDef, WireEnd } from '@/types/simulator'
import { getBoard } from './boards'
import { getComponent } from './components'

// Code Lab: students write an Arduino-style sketch and it really executes
// against the circuit they wired on the bench. We transpile the C++-ish
// source to JavaScript (types stripped, delay() awaited), then run it with
// an API whose digitalWrite/analogRead are bound to the actual wires:
// writing a pin only moves a part if that part is wired to that pin.

export interface CodeRunCallbacks {
  onSerial: (text: string) => void
  /** Full actuator-state map after every write — drives the bench art live */
  onActuators: (states: Record<string, boolean | number>) => void
  onDone: (reason: string) => void
  onError: (message: string) => void
}

export interface CodeRunHandle {
  stop: () => void
}

// --- Net resolution (mirrors simulation.ts: passives fuse their legs) ------

const endKey = (end: WireEnd): string =>
  end.kind === 'board' ? `board:${end.pinId}` : `comp:${end.instanceId}:${end.terminalId}`

function buildNetFinder(circuit: Circuit): (key: string) => string {
  const parent = new Map<string, string>()
  const find = (key: string): string => {
    let current = key
    for (;;) {
      const up = parent.get(current)
      if (up === undefined || up === current) return current
      current = up
    }
  }
  const union = (a: string, b: string): void => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  for (const wire of circuit.wires) union(endKey(wire.from), endKey(wire.to))
  for (const placed of circuit.components) {
    const legs = getComponent(placed.componentId).terminals.filter((t) => t.role === 'passive')
    for (let i = 1; i < legs.length; i++) {
      union(`comp:${placed.instanceId}:${legs[0].id}`, `comp:${placed.instanceId}:${legs[i].id}`)
    }
  }
  return find
}

interface TerminalOnPin {
  instanceId: string
  def: ComponentDef
  terminalId: string
  role: string
}

/** Everything electrically reachable from each board pin. */
function buildPinMap(circuit: Circuit): Map<string, TerminalOnPin[]> {
  const find = buildNetFinder(circuit)
  const board = getBoard(circuit.boardId)
  const byRoot = new Map<string, TerminalOnPin[]>()
  for (const placed of circuit.components) {
    const def = getComponent(placed.componentId)
    for (const t of def.terminals) {
      const root = find(`comp:${placed.instanceId}:${t.id}`)
      const list = byRoot.get(root)
      const item = { instanceId: placed.instanceId, def, terminalId: t.id, role: t.role }
      if (list) list.push(item)
      else byRoot.set(root, [item])
    }
  }
  const map = new Map<string, TerminalOnPin[]>()
  for (const pin of board.pins) {
    map.set(pin.id, byRoot.get(find(`board:${pin.id}`)) ?? [])
  }
  return map
}

// --- Deterministic sensor values (same flavour as simulation.ts) -----------

function noise(seedA: number, seedB: number): number {
  const x = Math.sin(seedA * 12.9898 + seedB * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) % 100000
}

function sensorValue(instanceId: string, idx: number, min: number, max: number, tick: number): number {
  const seed = hashStr(instanceId)
  const range = max - min
  const center = min + range * (0.3 + 0.4 * noise(seed + idx * 17, 1))
  const drift = Math.sin(tick * 0.08 + seed * 0.01 + idx) * range * 0.15
  const jitter = (noise(seed + idx * 31, tick) - 0.5) * range * 0.05
  return Math.min(max, Math.max(min, center + drift + jitter))
}

// --- Transpiler: Arduino C++ subset → JavaScript ----------------------------

const TYPE = '(?:unsigned\\s+)?(?:int|long|float|double|bool|boolean|byte|char|word|short|String)'

export function transpileSketch(src: string): string {
  let out = src
  // #include lines are meaningless here; #define NAME value → const
  out = out.replace(/^\s*#include.*$/gm, '')
  out = out.replace(/^\s*#define\s+(\w+)\s+(.+)$/gm, 'const $1 = $2')
  // function definitions: "void setup() {" / "float readCm(int pin) {"
  out = out.replace(
    new RegExp(`\\b(?:void|${TYPE})\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`, 'g'),
    (_m, name: string, params: string) => {
      const cleaned = params
        .split(',')
        .map((p) => p.trim().split(/\s+/).pop()?.replace('*', '') ?? '')
        .filter(Boolean)
        .join(', ')
      return `async function ${name}(${cleaned}) {`
    },
  )
  // variable declarations: "const int x = 5" → "const x = 5"; "int x" → "let x"
  out = out.replace(new RegExp(`\\bconst\\s+${TYPE}\\s+(\\w+)`, 'g'), 'const $1')
  out = out.replace(new RegExp(`\\b${TYPE}\\s+(\\w+\\s*[=;,)])`, 'g'), 'let $1')
  // C-style casts "(int)x" / "(float)x" → x
  out = out.replace(new RegExp(`\\(\\s*${TYPE}\\s*\\)`, 'g'), '')
  // delay must yield so Stop works and the UI stays alive
  out = out.replace(/\bdelay\s*\(/g, 'await delay(')
  out = out.replace(/\bdelayMicroseconds\s*\(/g, 'await delayMicroseconds(')
  // every user function is async, so calls to them must be awaited; rather
  // than building a full parser we only await the known-async API surface —
  // user helper functions are awaited via loop()/setup() being async and
  // students calling them with `await` is not required for correctness of
  // the simulation (their return values are plain numbers).
  return out
}

// --- Runtime -----------------------------------------------------------------

const MAX_LOOPS = 2000
const MAX_WALL_MS = 5 * 60 * 1000
const MAX_DELAY_MS = 10_000

export function runSketch(source: string, circuit: Circuit, cb: CodeRunCallbacks): CodeRunHandle {
  const board = getBoard(circuit.boardId)
  const pinMap = buildPinMap(circuit)
  const pinById = new Map(board.pins.map((p) => [p.id, p]))
  const adcMax = board.id === 'esp32-devkit' ? 4095 : 1023
  const started = Date.now()

  let stopped = false
  const states: Record<string, boolean | number> = {}

  /** Student pin token (13, 'D13', 'A0', 4 on ESP32…) → board pin id. */
  const resolvePin = (pin: unknown): string | null => {
    if (typeof pin === 'string') {
      const norm = pin.toLowerCase()
      if (pinById.has(norm)) return norm
      return null
    }
    if (typeof pin !== 'number' || !Number.isFinite(pin)) return null
    const n = Math.round(pin)
    if (board.id === 'arduino-uno') {
      // analogRead(A0) — A0..A5 are provided as string constants, but
      // analogRead(0) also legitimately means A0 in Arduino land.
      return pinById.has(`d${n}`) ? `d${n}` : pinById.has(`a${n}`) ? `a${n}` : null
    }
    return pinById.has(`gpio${n}`) ? `gpio${n}` : null
  }

  const terminalsOn = (pinId: string): TerminalOnPin[] => pinMap.get(pinId) ?? []

  const pushStates = () => cb.onActuators({ ...states })

  const writePin = (pin: unknown, value: boolean | number) => {
    const pinId = resolvePin(pin)
    if (!pinId) {
      cb.onSerial(`⚠ pin ${String(pin)} does not exist on the ${board.name}`)
      return
    }
    const targets = terminalsOn(pinId).filter((t) => t.role === 'digital-in')
    if (targets.length === 0) {
      cb.onSerial(`⚠ ${pinById.get(pinId)?.label}: nothing is wired to this pin — the write goes nowhere`)
      return
    }
    for (const t of targets) states[t.instanceId] = value
    pushStates()
  }

  // tick advances with wall time so repeated reads drift realistically
  const tick = () => Math.floor((Date.now() - started) / 400)

  const readAnalog = (pin: unknown): number => {
    const pinId = resolvePin(pin)
    if (!pinId) return 0
    const pinDef = pinById.get(pinId) as PinDef
    if (!pinDef.capabilities.includes('analog-in')) {
      cb.onSerial(`⚠ ${pinDef.label} has no ADC — analogRead returns garbage on real hardware`)
      return Math.round(noise(hashStr(pinId), tick()) * adcMax)
    }
    const sensor = terminalsOn(pinId).find((t) => t.role === 'analog-out')
    if (!sensor || !sensor.def.readings?.length) return 0
    const r = sensor.def.readings[0]
    const v = sensorValue(sensor.instanceId, 0, r.min, r.max, tick())
    // scale the physical reading onto the ADC range
    return Math.round(((v - r.min) / (r.max - r.min)) * adcMax)
  }

  const readDigital = (pin: unknown): number => {
    const pinId = resolvePin(pin)
    if (!pinId) return 0
    const t = tick()
    for (const term of terminalsOn(pinId)) {
      if (term.def.id === 'pir') return t % 13 < 2 ? 1 : 0
      if (term.def.id === 'push-button') return t % 7 === 0 ? 0 : 1 // pull-up logic
      if (term.role === 'digital-out') return t % 2
    }
    return 0
  }

  const findSensor = (pin: unknown, componentIds: string[]): TerminalOnPin | undefined => {
    const pinId = resolvePin(pin)
    if (!pinId) return undefined
    return terminalsOn(pinId).find((t) => componentIds.includes(t.def.id))
  }

  const sleep = async (ms: number) => {
    const total = Math.min(Math.max(0, ms), MAX_DELAY_MS)
    const step = 50
    for (let waited = 0; waited < total && !stopped; waited += step) {
      await new Promise((r) => setTimeout(r, Math.min(step, total - waited)))
    }
    if (stopped) throw new Error('__stopped__')
  }

  // Serial: assemble print() fragments into lines
  let lineBuf = ''
  const serialApi = {
    begin: (_baud?: number) => {},
    print: (x: unknown) => {
      lineBuf += String(x)
    },
    println: (x: unknown = '') => {
      cb.onSerial(lineBuf + String(x))
      lineBuf = ''
    },
  }

  const api: Record<string, unknown> = {
    // constants
    HIGH: 1,
    LOW: 0,
    OUTPUT: 'output',
    INPUT: 'input',
    INPUT_PULLUP: 'input_pullup',
    LED_BUILTIN: board.id === 'arduino-uno' ? 13 : 2,
    A0: 'a0', A1: 'a1', A2: 'a2', A3: 'a3', A4: 'a4', A5: 'a5',
    // core API
    pinMode: (_pin: unknown, _mode: unknown) => {},
    digitalWrite: (pin: unknown, v: unknown) => writePin(pin, !!v && v !== 0),
    analogWrite: (pin: unknown, v: unknown) =>
      writePin(pin, Math.min(1, Math.max(0, Number(v) / 255))),
    digitalRead: readDigital,
    analogRead: readAnalog,
    delay: sleep,
    delayMicroseconds: async (_us: number) => sleep(1),
    millis: () => Date.now() - started,
    micros: () => (Date.now() - started) * 1000,
    Serial: serialApi,
    // math helpers Arduino people expect
    map: (x: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
      Math.round(((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin),
    constrain: (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x)),
    abs: Math.abs, min: Math.min, max: Math.max, sqrt: Math.sqrt, pow: Math.pow,
    round: Math.round, floor: Math.floor, ceil: Math.ceil,
    random: (a: number, b?: number) =>
      b === undefined ? Math.floor(Math.random() * a) : a + Math.floor(Math.random() * (b - a)),
    isnan: (x: unknown) => Number.isNaN(Number(x)),
    // sensor helpers for parts that need a protocol library on real hardware
    readTemperature: (pin: unknown): number => {
      const s = findSensor(pin, ['dht11', 'ds18b20'])
      if (!s) {
        cb.onSerial('⚠ readTemperature: no DHT11/DS18B20 wired to that pin')
        return NaN
      }
      const r = s.def.readings!.find((x) => x.label === 'Temperature') ?? s.def.readings![0]
      return Math.round(sensorValue(s.instanceId, 0, r.min, r.max, tick()) * 10) / 10
    },
    readHumidity: (pin: unknown): number => {
      const s = findSensor(pin, ['dht11'])
      if (!s) {
        cb.onSerial('⚠ readHumidity: no DHT11 wired to that pin')
        return NaN
      }
      const r = s.def.readings!.find((x) => x.label === 'Humidity')!
      return Math.round(sensorValue(s.instanceId, 1, r.min, r.max, tick()) * 10) / 10
    },
    readDistanceCm: (trigPin: unknown, _echoPin?: unknown): number => {
      const s = findSensor(trigPin, ['hc-sr04'])
      if (!s) {
        cb.onSerial('⚠ readDistanceCm: no HC-SR04 wired to that pin')
        return -1
      }
      const r = s.def.readings![0]
      return Math.round(sensorValue(s.instanceId, 0, r.min, r.max, tick()) * 10) / 10
    },
    servoWrite: (pin: unknown, angle: unknown) =>
      writePin(pin, Math.min(1, Math.max(0, Number(angle) / 180))),
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  ;(async () => {
    let transpiled: string
    try {
      transpiled = transpileSketch(source)
    } catch (e) {
      cb.onError(`Could not parse the sketch: ${e instanceof Error ? e.message : String(e)}`)
      return
    }

    let program: { setup: (() => Promise<void>) | null; loop: (() => Promise<void>) | null }
    try {
      // `with` exposes the whole API as bare identifiers, exactly like the
      // Arduino global namespace. new Function is non-strict, so it's legal.
      const factory = new Function(
        '__api__',
        `with (__api__) {\n${transpiled}\nreturn { setup: typeof setup === 'function' ? setup : null, loop: typeof loop === 'function' ? loop : null }\n}`,
      )
      program = factory(api)
    } catch (e) {
      cb.onError(`Syntax error: ${e instanceof Error ? e.message : String(e)}`)
      return
    }

    if (!program.setup && !program.loop) {
      cb.onError('No setup() or loop() found — every sketch needs at least one of them.')
      return
    }

    timeoutId = setTimeout(() => {
      stopped = true
    }, MAX_WALL_MS)

    try {
      cb.onSerial(`— uploading sketch to ${board.name} —`)
      if (program.setup) await program.setup()
      let i = 0
      while (!stopped && program.loop && i < MAX_LOOPS) {
        await program.loop()
        i += 1
        // always yield between iterations so a delay-less loop can't freeze the tab
        await new Promise((r) => setTimeout(r, 15))
      }
      if (!stopped) {
        cb.onDone(
          program.loop && i >= MAX_LOOPS
            ? `stopped after ${MAX_LOOPS} loop() iterations (simulator safety limit)`
            : 'sketch finished',
        )
      } else {
        cb.onDone('stopped')
      }
    } catch (e) {
      if (e instanceof Error && e.message === '__stopped__') {
        cb.onDone('stopped')
      } else {
        cb.onError(`Runtime error: ${e instanceof Error ? e.message : String(e)}`)
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  })()

  return {
    stop: () => {
      stopped = true
    },
  }
}

// --- Starter sketches --------------------------------------------------------

export function starterSketch(circuit: Circuit): string {
  const board = getBoard(circuit.boardId)
  const led = board.id === 'arduino-uno' ? '13' : board.id === 'esp32-devkit' ? '2' : '17'
  const adc = board.id === 'arduino-uno' ? 'A0' : '34'
  return `// Write the sketch the way you think it should run — then press Run.
// Supported: pinMode, digitalWrite/analogWrite, digitalRead/analogRead,
// delay, millis, map, constrain, Serial.print/println — plus helpers
// readTemperature(pin), readHumidity(pin), readDistanceCm(trig, echo),
// servoWrite(pin, angle) for parts that need libraries on real hardware.

void setup() {
  Serial.begin(115200);
  pinMode(${led}, OUTPUT);
  Serial.println("hello from my own code!");
}

void loop() {
  digitalWrite(${led}, HIGH);   // only works if an LED is wired to pin ${led}
  delay(500);
  digitalWrite(${led}, LOW);
  delay(500);

  int light = analogRead(${adc});  // reads whatever sensor is on ${adc}
  Serial.print("analog reading: ");
  Serial.println(light);
}
`
}
