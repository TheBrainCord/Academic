import type {
  BoardId,
  Circuit,
  ComponentId,
  PinCapability,
  ValidationResult,
} from '@/types/simulator'
import { boardPinsReachableFrom } from './validation'

export interface ChallengeRequirement {
  id: string
  label: string
  met: boolean
}

export interface ChallengeStatus {
  complete: boolean
  requirements: ChallengeRequirement[]
}

export interface ChallengeDef {
  id: string
  title: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  board: BoardId
  /** Story-style task shown to the student */
  brief: string
  hint: string
  check: (circuit: Circuit, validation: ValidationResult) => ChallengeStatus
}

// ---------------------------------------------------------------------------
// Check helpers — all reachability goes through the validation engine's net
// model, so a resistor in series still counts as "connected".
// ---------------------------------------------------------------------------

const instancesOf = (circuit: Circuit, componentId: ComponentId) =>
  circuit.components.filter((c) => c.componentId === componentId)

const reaches = (
  circuit: Circuit,
  instanceId: string,
  terminalId: string,
  capability: PinCapability,
): boolean =>
  boardPinsReachableFrom(circuit, instanceId, terminalId).some((p) =>
    p.capabilities.includes(capability),
  )

const reachesAnyPower = (circuit: Circuit, instanceId: string, terminalId: string): boolean =>
  reaches(circuit, instanceId, terminalId, 'power-5v') ||
  reaches(circuit, instanceId, terminalId, 'power-3v3')

const reachesDigitalInput = (circuit: Circuit, instanceId: string, terminalId: string): boolean =>
  reaches(circuit, instanceId, terminalId, 'gpio') ||
  reaches(circuit, instanceId, terminalId, 'digital-input')

const reachesDigitalOutput = (circuit: Circuit, instanceId: string, terminalId: string): boolean =>
  reaches(circuit, instanceId, terminalId, 'gpio') ||
  reaches(circuit, instanceId, terminalId, 'digital-output')

/** True when some instance of the component satisfies the predicate. */
const someInstance = (
  circuit: Circuit,
  componentId: ComponentId,
  predicate: (instanceId: string) => boolean,
): boolean => instancesOf(circuit, componentId).some((c) => predicate(c.instanceId))

const req = (id: string, label: string, met: boolean): ChallengeRequirement => ({ id, label, met })

const status = (requirements: ChallengeRequirement[]): ChallengeStatus => ({
  complete: requirements.every((r) => r.met),
  requirements,
})

const noErrors = (validation: ValidationResult): boolean => validation.ok

// A wired LED: anode reaches a digital pin (through the resistor) and the
// cathode reaches ground. Validation separately enforces the resistor rule.
const ledWired = (circuit: Circuit, capability?: PinCapability): boolean =>
  someInstance(
    circuit,
    'led',
    (id) => (capability ? reaches(circuit, id, 'anode', capability) : reachesDigitalOutput(circuit, id, 'anode')) && reaches(circuit, id, 'cathode', 'ground'),
  )

// ---------------------------------------------------------------------------
// The challenge bank
// ---------------------------------------------------------------------------

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'first-light',
    title: 'First Light',
    difficulty: 'beginner',
    board: 'arduino-uno',
    brief:
      'Every maker starts here: make an LED light up safely from pin D13 territory. Wire an LED to any digital pin — through a resistor, or it burns out — and back to ground.',
    hint: 'Digital pin → resistor leg 1 → resistor leg 2 → LED anode → LED cathode → GND.',
    check: (circuit, validation) =>
      status([
        req('board', 'Use the Arduino Uno', circuit.boardId === 'arduino-uno'),
        req('led', 'Place an LED on the bench', instancesOf(circuit, 'led').length > 0),
        req(
          'resistor',
          'Place a 220Ω resistor',
          instancesOf(circuit, 'resistor-220').length > 0,
        ),
        req('wired', 'LED wired: digital pin → anode, cathode → GND', ledWired(circuit)),
        req('valid', 'No errors in Test Connections', noErrors(validation)),
      ]),
  },
  {
    id: 'breathing-led',
    title: 'Breathing LED',
    difficulty: 'beginner',
    board: 'arduino-uno',
    brief:
      'Blinking is easy — breathing is style. Move your LED to a PWM pin (the ones marked with ~) so analogWrite() could fade it smoothly in and out.',
    hint: 'On the Uno only D3, D5, D6, D9, D10 and D11 support PWM. Keep the resistor in series.',
    check: (circuit, validation) =>
      status([
        req('board', 'Use the Arduino Uno', circuit.boardId === 'arduino-uno'),
        req('wired', 'LED wired to a PWM (~) pin through a resistor', ledWired(circuit, 'pwm')),
        req('valid', 'No errors in Test Connections', noErrors(validation)),
      ]),
  },
  {
    id: 'weather-station',
    title: 'Hostel-Room Weather Station',
    difficulty: 'beginner',
    board: 'esp32-devkit',
    brief:
      'Build the sensing core of a Wi-Fi weather station: wire a DHT11 to the ESP32 so it can report temperature and humidity. Mind the ESP32’s 3.3V logic.',
    hint: 'DHT11 VCC → 3V3, GND → GND, DATA → any GPIO. Then press Run and watch the serial monitor.',
    check: (circuit, validation) =>
      status([
        req('board', 'Use the ESP32 DevKit', circuit.boardId === 'esp32-devkit'),
        req(
          'power',
          'DHT11 powered: VCC → power, GND → ground',
          someInstance(
            circuit,
            'dht11',
            (id) => reachesAnyPower(circuit, id, 'vcc') && reaches(circuit, id, 'gnd', 'ground'),
          ),
        ),
        req(
          'data',
          'DHT11 DATA wired to a GPIO pin',
          someInstance(circuit, 'dht11', (id) => reachesDigitalInput(circuit, id, 'data')),
        ),
        req('valid', 'No errors in Test Connections', noErrors(validation)),
      ]),
  },
  {
    id: 'knob-reader',
    title: 'Knob Reader',
    difficulty: 'intermediate',
    board: 'arduino-uno',
    brief:
      'Analog input 101: wire a potentiometer so the board can read its position as a number from 0 to 1023 — the foundation of every volume knob and joystick.',
    hint: 'Outer legs to 5V and GND; the middle wiper pin must land on one of A0–A5.',
    check: (circuit, validation) =>
      status([
        req('board', 'Use the Arduino Uno', circuit.boardId === 'arduino-uno'),
        req(
          'power',
          'Potentiometer powered: VCC → power, GND → ground',
          someInstance(
            circuit,
            'potentiometer',
            (id) => reachesAnyPower(circuit, id, 'vcc') && reaches(circuit, id, 'gnd', 'ground'),
          ),
        ),
        req(
          'wiper',
          'Wiper wired to an analog-in pin (A0–A5)',
          someInstance(circuit, 'potentiometer', (id) => reaches(circuit, id, 'wiper', 'analog-in')),
        ),
        req('valid', 'No errors in Test Connections', noErrors(validation)),
      ]),
  },
  {
    id: 'parking-sensor',
    title: 'Campus Parking Sensor',
    difficulty: 'intermediate',
    board: 'arduino-uno',
    brief:
      'Prototype the parking assistant from the Smart City mission: an HC-SR04 measures distance and a buzzer warns when something is close. The HC-SR04 really wants 5V.',
    hint: 'HC-SR04: VCC → 5V, TRIG and ECHO on two different digital pins, GND → GND. Buzzer: + to a digital pin, − to GND.',
    check: (circuit, validation) => {
      const sonarOk = someInstance(circuit, 'hc-sr04', (id) => {
        const trigPins = boardPinsReachableFrom(circuit, id, 'trig').map((p) => p.id)
        const echoPins = boardPinsReachableFrom(circuit, id, 'echo').map((p) => p.id)
        const distinct =
          trigPins.length > 0 &&
          echoPins.length > 0 &&
          trigPins.some((pin) => !echoPins.includes(pin))
        return reaches(circuit, id, 'vcc', 'power-5v') && reaches(circuit, id, 'gnd', 'ground') && distinct
      })
      const buzzerOk = someInstance(
        circuit,
        'buzzer',
        (id) =>
          reachesDigitalOutput(circuit, id, 'positive') && reaches(circuit, id, 'negative', 'ground'),
      )
      return status([
        req('board', 'Use the Arduino Uno', circuit.boardId === 'arduino-uno'),
        req('sonar', 'HC-SR04 on 5V with TRIG and ECHO on two different digital pins', sonarOk),
        req('buzzer', 'Buzzer wired: + → digital pin, − → GND', buzzerOk),
        req('valid', 'No errors in Test Connections', noErrors(validation)),
      ])
    },
  },
  {
    id: 'night-light-pi',
    title: 'Night-Light on the Pi',
    difficulty: 'advanced',
    board: 'raspberry-pi-4',
    brief:
      'The Raspberry Pi has no analog pins — so build something fully digital: a PIR motion sensor that switches an LED night-light. Everything here speaks HIGH/LOW, which is exactly why it works on the Pi.',
    hint: 'PIR: VCC → 5V (it needs 4.5V+), OUT → a GPIO, GND → GND. LED through a resistor to another GPIO, cathode → GND.',
    check: (circuit, validation) =>
      status([
        req('board', 'Use the Raspberry Pi 4', circuit.boardId === 'raspberry-pi-4'),
        req(
          'pir',
          'PIR powered from 5V with OUT on a GPIO pin',
          someInstance(
            circuit,
            'pir',
            (id) =>
              reaches(circuit, id, 'vcc', 'power-5v') &&
              reaches(circuit, id, 'gnd', 'ground') &&
              reachesDigitalInput(circuit, id, 'out'),
          ),
        ),
        req('led', 'LED wired to a GPIO through a resistor, cathode → GND', ledWired(circuit)),
        req('valid', 'No errors in Test Connections', noErrors(validation)),
      ]),
  },
]

export function getChallenge(id: string): ChallengeDef | undefined {
  return CHALLENGES.find((c) => c.id === id)
}
