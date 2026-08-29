import type { HardwareLesson } from '@/types/hardware'

export const LED_CURRENT_LIMITING_LESSON = {
  id: 'led-current-limiting', status: 'complete', title: 'Safe LED indication with a current-limiting resistor',
  summary: 'Build the same active-high indicator on an Uno, ESP32 and Raspberry Pi while keeping each platform’s voltage, pin naming and runtime model explicit.',
  outcomes: ['Identify LED polarity and form a complete series circuit.', 'Calculate a conservative resistor with Ohm’s law.', 'Translate a software pin name into the correct physical connection.', 'Diagnose dark, dim and unsafe LED circuits.'],
  prerequisites: ['Voltage, current, resistance and series circuits', 'Breadboard row connectivity', 'Power removed before rewiring'],
  boards: ['arduino-uno', 'esp32-devkit-v1', 'raspberry-pi'], components: ['led', 'resistor'],
  supportingParts: [
    { componentId: 'led', quantity: 1, specification: 'Red LED, typical Vf about 2.0 V', purpose: 'Visible indicator', alternatives: ['Green LED after recalculating from its Vf'] },
    { componentId: 'resistor', quantity: 1, specification: '330 Ω, at least 0.125 W for Uno; 220–330 Ω for 3.3 V boards', purpose: 'Limit LED and GPIO current' },
    { componentId: 'breadboard-jumpers', quantity: 1, purpose: 'Make a reversible series circuit' },
  ],
  calculations: [{
    title: 'Choose the series resistor', formula: 'R = (VGPIO − Vf) / I; then P = I²R',
    workedExamples: ['Uno: (5.0 V − 2.0 V) / 0.009 A ≈ 333 Ω → choose 330 Ω; I ≈ 9.1 mA and resistor power ≈ 0.027 W.', 'ESP32/Pi: (3.3 V − 2.0 V) / 0.005 A = 260 Ω → choose 330 Ω for ≈3.9 mA or 220 Ω for ≈5.9 mA.'],
    designNote: 'Vf is a range, GPIO HIGH is not an ideal supply and brightness is nonlinear. Design below board limits, calculate worst cases, and measure rather than treating 40 mA or any absolute maximum as an operating value.',
  }],
  connections: [
    { boardId: 'arduino-uno', componentPin: 'LED anode', boardPin: 'D8', path: 'D8 → 330 Ω resistor → LED anode; LED cathode → GND', rationale: 'D8 is addressed as 8 in Arduino code; 330 Ω gives a conservative current from 5 V.' },
    { boardId: 'esp32-devkit-v1', componentPin: 'LED anode', boardPin: 'GPIO18', path: 'GPIO18 → 220–330 Ω resistor → LED anode; LED cathode → GND', rationale: 'GPIO18 avoids common boot-strapping pins and is addressed as 18; the GPIO is 3.3 V only.' },
    { boardId: 'raspberry-pi', componentPin: 'LED anode', boardPin: 'BCM17 / physical pin 11', path: 'Physical pin 11 (BCM17) → 220–330 Ω resistor → LED anode; LED cathode → physical pin 6 (GND)', rationale: 'gpiozero uses BCM numbering by default. “17” is not physical header pin 17.' },
  ],
  safety: [
    { id: 'series-resistor', severity: 'critical', rule: 'Place one calculated resistor in series with every discrete LED.', reason: 'An LED does not self-limit current; excessive current can damage both LED and GPIO.', evidenceCheck: 'Trace a single path from GPIO through resistor and LED to ground.' },
    { id: 'power-off', severity: 'critical', rule: 'Disconnect USB/power—and shut the Pi down—before rewiring.', reason: 'A displaced lead can short a power rail or GPIO.', evidenceCheck: 'Instructor confirms all power indicators are off before hands enter the circuit.' },
    { id: 'logic-level', severity: 'critical', rule: 'Never apply 5 V to ESP32 or Raspberry Pi GPIO.', reason: 'Their GPIO logic is 3.3 V and is not 5 V tolerant.', evidenceCheck: 'Meter/diagram shows the LED circuit is driven only by its GPIO, with no 5 V signal wire.' },
    { id: 'pin-budget', severity: 'warning', rule: 'Keep current conservative per pin and consider aggregate GPIO/rail limits.', reason: 'Absolute maximum ratings are damage boundaries, not design targets.', evidenceCheck: 'Calculation predicts no more than 10 mA here.' },
    { id: 'polarity', severity: 'good-practice', rule: 'Identify anode and cathode before insertion.', reason: 'A reversed LED normally stays dark, complicating diagnosis.', evidenceCheck: 'Cathode flat/short lead is recorded before trimming or insertion.' },
  ],
  procedure: ['Select one platform and keep it unpowered.', 'Identify LED cathode using the flat edge/short lead; confirm the exact board pin labels.', 'Build the stated GPIO → resistor → anode → cathode → GND series path. The resistor may be on either LED side.', 'Peer-check breadboard rows, polarity, resistor value and board numbering.', 'Power the board, deploy only its matching code section and observe a one-second blink.', 'If it fails, remove power before continuity, polarity or resistance checks.', 'Record GPIO HIGH voltage and voltage across the resistor; compute measured current as VR/R.'],
  codeSections: [
    { boardId: 'arduino-uno', language: 'arduino-cpp', code: `const uint8_t LED_PIN = 8;\nvoid setup() { pinMode(LED_PIN, OUTPUT); }\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH); delay(1000);\n  digitalWrite(LED_PIN, LOW);  delay(1000);\n}`,
      hardwareLinks: [{ code: 'LED_PIN = 8', hardware: 'Uno header D8', explanation: 'Arduino’s integer 8 maps to the header marked D8.' }, { code: 'pinMode(..., OUTPUT)', hardware: 'ATmega output driver', explanation: 'Enables the push-pull output; it does not add current limiting.' }, { code: 'digitalWrite(..., HIGH)', hardware: 'D8 near 5 V', explanation: 'Voltage across resistor plus LED drives current and light.' }] },
    { boardId: 'esp32-devkit-v1', language: 'arduino-cpp', code: `const uint8_t LED_PIN = 18;\nvoid setup() { pinMode(LED_PIN, OUTPUT); }\nvoid loop() {\n  digitalWrite(LED_PIN, HIGH); delay(1000);\n  digitalWrite(LED_PIN, LOW);  delay(1000);\n}`,
      hardwareLinks: [{ code: 'LED_PIN = 18', hardware: 'ESP32 pad/header GPIO18', explanation: 'This means GPIO number 18, not eighteenth header position.' }, { code: 'HIGH', hardware: 'Approximately 3.3 V GPIO logic', explanation: 'The lower voltage changes resistor current relative to Uno.' }] },
    { boardId: 'raspberry-pi', language: 'python', code: `from gpiozero import LED\nfrom signal import pause\n\nled = LED(17)  # BCM17, physical header pin 11\nled.blink(on_time=1, off_time=1)\npause()`,
      hardwareLinks: [{ code: 'LED(17)', hardware: 'BCM17 at physical pin 11', explanation: 'gpiozero’s default numbering is Broadcom GPIO numbering.' }, { code: 'led.blink(...)', hardware: 'Linux schedules repeated GPIO state changes', explanation: 'gpiozero toggles the physical output; timing is OS-managed rather than a bare-metal loop.' }, { code: 'pause()', hardware: 'Process remains alive', explanation: 'Keeping the process alive lets the background blink continue.' }] },
  ],
  failureModes: [
    { symptom: 'LED never lights', likelyCause: 'Reversed LED, wrong breadboard row, wrong pin numbering or no common ground', diagnosis: 'Power off; trace continuity and compare code pin to silkscreen/physical pin.', correction: 'Correct polarity/path or deploy the code for the selected board.' },
    { symptom: 'LED is continuously on', likelyCause: 'Connected to a power rail instead of GPIO, or program is not toggling', diagnosis: 'Measure the anode source and inspect serial/deployment state.', correction: 'Move the resistor input to the specified GPIO and restart the correct program.' },
    { symptom: 'LED is dim', likelyCause: 'Large resistance, high-Vf LED, weak connection or PWM/duty effect', diagnosis: 'Measure resistor value, GPIO voltage and resistor voltage.', correction: 'Fix connection or recalculate within the safe current target; do not remove the resistor.' },
    { symptom: 'LED/board becomes hot or resets', likelyCause: 'Missing/too-small resistor or short circuit', diagnosis: 'Remove power immediately and inspect before measuring resistance.', correction: 'Replace damaged parts if necessary and rebuild with the calculated series resistor.' },
    { symptom: 'Pi code says resource busy/permission error', likelyCause: 'Another process owns GPIO or environment is not configured', diagnosis: 'Stop GPIO-using services/processes and verify gpiozero backend.', correction: 'Release the pin and run through the supported Raspberry Pi OS workflow.' },
  ],
  realWorldUses: ['Device power/status indication', 'Alarm and connectivity state', 'Active-low diagnostic LEDs in products', 'Optocoupler input and solid-state indication as extensions of the same current-budget principle'],
  alternatives: [
    { option: 'Board’s built-in LED', whenToUse: 'First software smoke test', tradeOff: 'No wiring practice and pin/polarity varies by board.' },
    { option: 'Higher resistor (680 Ω–1 kΩ)', whenToUse: 'Low-current/status indication', tradeOff: 'Safer and lower power but dimmer.' },
    { option: 'Transistor or logic-level MOSFET driver', whenToUse: 'Many LEDs or loads above GPIO current', tradeOff: 'Adds parts but moves load current away from GPIO.' },
    { option: 'Addressable RGB LED', whenToUse: 'Colour/status encoding', tradeOff: 'Requires a protocol, decoupling and voltage-level/power analysis.' },
  ],
  experiments: [
    { id: 'resistance-brightness', level: 'beginner', title: 'Resistance, current and perceived brightness', hypothesis: 'Lower safe resistance increases measured current, but perceived brightness does not rise linearly.', procedure: ['Try 220 Ω, 330 Ω and 1 kΩ one at a time with power removed between changes.', 'Blink each at the same duty cycle and ambient light.'], measurements: ['GPIO HIGH voltage', 'Voltage across resistor', 'Calculated current', 'Ranked brightness'], analysis: ['Plot brightness rank against calculated current.', 'Explain why a direct LED connection is not a valid fourth case.'], successCriteria: ['Every configuration remains within the 10 mA lesson target.', 'Current is derived from measured resistor voltage.'] },
    { id: 'gpio-characterisation', level: 'msc', title: 'Characterise the GPIO/LED load model', hypothesis: 'GPIO HIGH voltage droops as sourced current increases and LED Vf varies with current and temperature.', procedure: ['Select a datasheet-safe resistor sweep.', 'Measure VGPIO, Vf and VR at stable temperature.', 'Repeat after controlled LED warming without exceeding ratings.', 'Fit a simple GPIO output-resistance plus diode model and report uncertainty.'], measurements: ['VGPIO, Vf, VR, resistance tolerance, ambient/LED temperature'], analysis: ['Estimate effective GPIO output resistance from voltage-current slope.', 'Propagate meter and resistor tolerances.', 'Compare Uno and one 3.3 V platform without claiming identical drive strength.'], successCriteria: ['Raw data and uncertainty are retained.', 'Conclusions distinguish measured behaviour from absolute-maximum ratings.'] },
  ],
  examFraming: [
    { prompt: 'Design a red LED indicator for a 3.3 V GPIO at approximately 5 mA (Vf = 2.0 V). Choose a standard resistor and state two safety checks.', markingGuide: ['R ≈ 260 Ω calculation', 'A nearby standard value such as 270 Ω or conservative 330 Ω with recalculated current', 'Series topology and polarity', 'GPIO/aggregate rating and power-off verification'] },
    { prompt: 'Explain why identical source code integer “17” can create a wiring error between an MCU and Raspberry Pi.', markingGuide: ['Separates logical GPIO numbering from physical header position', 'States BCM17 is physical pin 11 in this lesson', 'Requires pinout/silkscreen verification rather than assumption'] },
  ],
  quiz: [
    { id: 'resistor-purpose', prompt: 'Why is the series resistor required?', correctOptionId: 'limit', options: [{ id: 'limit', text: 'To limit current through the LED and GPIO', feedback: 'Correct: the voltage difference is dropped across the resistor, setting current.' }, { id: 'store', text: 'To store charge for blinking', feedback: 'A resistor dissipates energy; a capacitor stores charge.' }, { id: 'polarity', text: 'To reverse LED polarity', feedback: 'A resistor is not polarised and does not reverse the LED.' }], explanation: 'Use R = (VGPIO − Vf)/I to choose it.' },
    { id: 'pi-numbering', prompt: 'Where is gpiozero LED(17) connected in this lesson?', correctOptionId: 'bcm', options: [{ id: 'physical', text: 'Physical pin 17', feedback: 'That confuses header position with BCM numbering.' }, { id: 'bcm', text: 'BCM17, physical pin 11', feedback: 'Correct: both naming systems are made explicit.' }, { id: 'uno', text: 'Arduino D17', feedback: 'The program is for Raspberry Pi, not Uno.' }], explanation: 'Always state the numbering convention and physical position.' },
    { id: 'five-volts', prompt: 'May a 5 V signal be applied to ESP32 or Pi GPIO?', correctOptionId: 'no', options: [{ id: 'yes', text: 'Yes, when a resistor is present', feedback: 'A random series resistor is not a validated logic-level translator.' }, { id: 'no', text: 'No; use a suitable level interface', feedback: 'Correct: these GPIOs are 3.3 V only.' }], explanation: 'Power-rail availability does not mean GPIO is 5 V tolerant.' },
  ],
  references: [
    { id: 'arduino-uno-doc', title: 'Arduino Uno Rev3 documentation', publisher: 'Arduino', url: 'https://docs.arduino.cc/hardware/uno-rev3/', supports: ['Uno operating voltage, pin mapping and board technical specifications'], accessedOn: '2026-08-29' },
    { id: 'atmega328p-datasheet', title: 'ATmega328P Data Sheet', publisher: 'Microchip Technology', url: 'https://www.microchip.com/en-us/product/atmega328p', supports: ['GPIO electrical characteristics and absolute maximum ratings'], accessedOn: '2026-08-29' },
    { id: 'esp32-datasheet', title: 'ESP32 Series Datasheet', publisher: 'Espressif Systems', url: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf', supports: ['ESP32 IO voltage and electrical characteristics'], accessedOn: '2026-08-29' },
    { id: 'pi-gpio', title: 'Raspberry Pi GPIO usage and pin numbering', publisher: 'Raspberry Pi Ltd', url: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#gpio', supports: ['40-pin header GPIO identity and 3.3 V caution'], accessedOn: '2026-08-29' },
    { id: 'gpiozero-led', title: 'gpiozero LED recipe and API', publisher: 'Raspberry Pi Foundation', url: 'https://gpiozero.readthedocs.io/en/stable/recipes.html#led', supports: ['LED(17), blink and pause software behaviour'], accessedOn: '2026-08-29' },
  ],
  verification: [
    { scope: 'Arduino Uno wiring and electrical claims', verifiedOn: '2026-08-29', method: 'Cross-checked official board documentation and MCU datasheet.', referenceIds: ['arduino-uno-doc', 'atmega328p-datasheet'], reverifyBy: '2027-08-29' },
    { scope: 'ESP32 wiring and voltage claims', verifiedOn: '2026-08-29', method: 'Cross-checked Espressif datasheet; classroom must still verify its DevKit variant.', referenceIds: ['esp32-datasheet'], reverifyBy: '2027-08-29' },
    { scope: 'Raspberry Pi header and Python claims', verifiedOn: '2026-08-29', method: 'Cross-checked Raspberry Pi documentation and gpiozero recipe.', referenceIds: ['pi-gpio', 'gpiozero-led'], reverifyBy: '2027-08-29' },
  ],
  evidenceChecklist: [
    { id: 'board-pin-maps', claim: 'Each code pin maps to the stated physical/header label.', evidence: 'Uno D8, ESP32 GPIO18 and Pi BCM17/physical 11 are explicit in connection and code records.', referenceIds: ['arduino-uno-doc', 'esp32-datasheet', 'pi-gpio'], checked: true },
    { id: 'logic-voltage', claim: 'Platform voltage differences are visible and drive resistor/safety choices.', evidence: 'Worked 5 V and 3.3 V calculations plus explicit 3.3 V-only warnings.', referenceIds: ['arduino-uno-doc', 'esp32-datasheet', 'pi-gpio'], checked: true },
    { id: 'ratings-language', claim: 'Absolute maximum is not taught as an operating target.', evidence: 'Design note and safety rule use a conservative lesson target.', referenceIds: ['atmega328p-datasheet', 'esp32-datasheet'], checked: true },
    { id: 'code-hardware', claim: 'Every platform program explains its physical effects.', evidence: 'Each code section has code-to-hardware links.', referenceIds: ['gpiozero-led'], checked: true },
    { id: 'pedagogy', claim: 'Lesson includes diagnosis, application, progression, assessment and feedback.', evidence: 'Failure modes, real uses, two experiment levels, exam framing and option-specific quiz feedback are populated.', referenceIds: [], checked: true },
    { id: 'not-simulation', claim: 'Catalogue status does not imply a finished simulator.', evidence: 'Every catalogue record explicitly declares simulationAvailable false; future lessons use future status.', referenceIds: [], checked: true },
  ],
} as const satisfies HardwareLesson
