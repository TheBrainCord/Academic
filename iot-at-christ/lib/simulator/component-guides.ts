import type { ComponentId } from '@/types/simulator'

export interface IndustryUse {
  sector: string
  example: string
}

export interface ComponentGuide {
  /** The physical principle, in 2–3 friendly sentences */
  howItWorks: string
  /** What kind of signal it speaks and what the board sees */
  signal: string
  /** Step-by-step wiring recipe for the Virtual Lab */
  wiring: string[]
  /** Where the real IoT industry uses this part */
  industryUses: IndustryUse[]
  /** One memorable line students quote in exams */
  keyTakeaway: string
}

export const COMPONENT_GUIDES: Record<ComponentId, ComponentGuide> = {
  led: {
    howItWorks:
      'An LED is a diode — current flows only from anode (+) to cathode (−). When electrons cross its semiconductor junction they drop energy as photons: light. The junction has almost no resistance once conducting, so without a series resistor the current runs away and burns it out in seconds.',
    signal:
      'Pure output. The board drives it HIGH/LOW (on/off) from a digital pin, or fades it with PWM — rapid pulses whose duty cycle your eye averages into brightness.',
    wiring: [
      'Digital (or PWM ~) pin → resistor leg 1',
      'Resistor leg 2 → LED anode (+, the long leg)',
      'LED cathode (−) → GND',
    ],
    industryUses: [
      { sector: 'Status indication', example: 'Every router, smart meter and EV charger uses LEDs as the cheapest possible health display — a blink pattern is a diagnostic protocol.' },
      { sector: 'Smart street lighting', example: 'Municipal LED street lights with LoRa controllers dim to 30% when no motion is detected, cutting energy use ~40%.' },
      { sector: 'Li-Fi research', example: 'High-speed LED flicker (invisible to the eye) can carry data — an active research area for EMI-free hospital connectivity.' },
    ],
    keyTakeaway: 'An LED is a diode: polarity matters, and the resistor is not optional.',
  },
  'resistor-220': {
    howItWorks:
      'A resistor opposes current flow by converting a little electrical energy to heat — Ohm\'s law in physical form: I = V/R. A 220Ω resistor on a 5V pin limits current to about 20mA, exactly what an LED wants. It has no polarity; either leg can face either way.',
    signal:
      'Passive — it does not read or produce signals. It shapes current and divides voltage for the parts around it.',
    wiring: [
      'Place it in series: pin → resistor → component',
      'Either leg can connect to either side',
    ],
    industryUses: [
      { sector: 'Every PCB on earth', example: 'A typical IoT gateway board carries 100+ resistors for current limiting, pull-ups on I2C buses, and voltage dividers on battery monitors.' },
      { sector: 'Sensing', example: 'Strain gauges, thermistors and LDRs are all just resistors whose value changes with the physical world — measured via a voltage divider.' },
      { sector: 'Safe level-shifting', example: 'A two-resistor divider drops a 5V sensor signal to 3.3V so it can\'t damage an ESP32 or Raspberry Pi input.' },
    ],
    keyTakeaway: 'I = V/R — the resistor is how you decide how much current flows.',
  },
  'push-button': {
    howItWorks:
      'A momentary switch: pressing it pushes two springy metal contacts together, closing the circuit; releasing opens it again. The contacts physically bounce for a few milliseconds on each press, so real firmware "debounces" — ignores changes faster than ~20ms.',
    signal:
      'Digital input. With the internal pull-up enabled (INPUT_PULLUP), the pin reads HIGH at rest and LOW when pressed — pressing connects the pin to ground.',
    wiring: [
      'Signal leg → any digital/GPIO pin',
      'Other leg → GND',
      'In code: enable the internal pull-up resistor',
    ],
    industryUses: [
      { sector: 'Industrial HMI', example: 'Emergency-stop buttons on factory floors are safety-rated switches wired into PLCs — the same closing-contact principle with redundant contacts.' },
      { sector: 'Smart devices', example: 'The reset/pairing button on every smart plug and Wi-Fi camera is a push button read with debouncing and long-press detection.' },
      { sector: 'Assisted living', example: 'Wearable SOS pendants for elders are a button + BLE radio + battery — one of the highest-impact simplest IoT devices.' },
    ],
    keyTakeaway: 'Buttons read LOW when pressed (with a pull-up) — and they bounce.',
  },
  buzzer: {
    howItWorks:
      'An active buzzer contains a piezo disc and its own oscillator. Give it DC power and the disc flexes thousands of times per second, pushing air — sound. A piezo element actually works both ways: bend it and it generates voltage, which is how piezo sensors detect knocks and vibration.',
    signal:
      'Output. Drive it HIGH to beep, LOW for silence. On a PWM pin you can vary perceived volume or, on passive buzzers, the pitch.',
    wiring: ['+ terminal → digital or PWM pin', '− terminal → GND'],
    industryUses: [
      { sector: 'Safety systems', example: 'Industrial gas detectors pair a sensor with an 85dB buzzer — the alarm must work even if the network is down, so it\'s driven locally, not from the cloud.' },
      { sector: 'Logistics', example: 'Cold-chain trackers beep when a refrigerated container door stays open too long, prompting action before the cargo spoils.' },
      { sector: 'Vehicle electronics', example: 'Reverse-parking warnings map ultrasonic distance to beep rate — the exact circuit you can build in this lab.' },
    ],
    keyTakeaway: 'Local alarms must not depend on the network — the buzzer is the last line of defence.',
  },
  dht11: {
    howItWorks:
      'Inside are two sensors: a thermistor (resistance falls as temperature rises) and a capacitive humidity element (water vapour between two plates changes capacitance). A tiny chip digitises both and sends them as a 40-bit pulse train over one data wire — slow (one reading per second) but dead simple.',
    signal:
      'Single-wire digital protocol. The board pulls the line low to ask, the sensor answers with timed pulses. Libraries handle the timing for you.',
    wiring: ['VCC → 3.3V or 5V', 'DATA → any digital/GPIO pin', 'GND → GND'],
    industryUses: [
      { sector: 'Agriculture', example: 'Polyhouse farms across Karnataka log temperature/humidity to time irrigation and ventilation — the entry sensor is a DHT-class part before farms upgrade to SHT-grade accuracy.' },
      { sector: 'Data centres', example: 'Rack-level environment monitoring uses dense grids of cheap temp/humidity nodes; one overheating rack can be isolated before servers throttle.' },
      { sector: 'Pharma cold chain', example: 'Vaccine storage regulation requires continuous temperature + humidity logging with alerts — a legal requirement, not a luxury.' },
    ],
    keyTakeaway: 'One wire, two readings — and a 1Hz sample rate teaches you that sensors have limits.',
  },
  'hc-sr04': {
    howItWorks:
      'Echolocation, like a bat. The board pulses TRIG; the module fires an ultrasonic chirp at 40kHz (above human hearing) and raises ECHO until the reflection returns. Sound travels ~343 m/s, so distance = (echo time × 343) / 2 — halved because the sound goes there and back.',
    signal:
      'Two digital pins: TRIG is an input to the module (you pulse it), ECHO is its output (you time it). The measurement is literally a pulse width.',
    wiring: [
      'VCC → 5V (it is unreliable at 3.3V)',
      'TRIG → one digital pin',
      'ECHO → a different digital pin',
      'GND → GND',
    ],
    industryUses: [
      { sector: 'Smart parking', example: 'Per-slot ultrasonic sensors feed live availability to apps in malls and airports — Bengaluru\'s smart-parking pilots use exactly this principle.' },
      { sector: 'Waste management', example: 'Fill-level sensors in smart bins let municipal trucks route only to bins that are actually full, cutting collection kilometres ~30%.' },
      { sector: 'Water management', example: 'Ultrasonic level measurement of tanks and storm drains — non-contact, so nothing corrodes in the water.' },
    ],
    keyTakeaway: 'Distance = time × speed of sound ÷ 2 — you are measuring time, not distance.',
  },
  ldr: {
    howItWorks:
      'A light-dependent resistor is made of a semiconductor whose resistance collapses when photons hit it — from megaohms in darkness to a few hundred ohms in sunlight. Put it in a voltage divider and the output voltage tracks brightness, which the board\'s ADC turns into a number.',
    signal:
      'Analog. The board reads a voltage level (0–1023 on the Uno\'s 10-bit ADC). No protocol — just physics and Ohm\'s law.',
    wiring: [
      'Leg 1 (VCC) → power rail',
      'Leg 2 (signal) → an analog-in pin (A0–A5 on the Uno)',
      'Note: the Raspberry Pi cannot read this without an external ADC',
    ],
    industryUses: [
      { sector: 'Street lighting', example: 'Dusk-to-dawn switching of millions of street lights worldwide still runs on LDR circuits — robust, cheap, zero-software.' },
      { sector: 'Agritech', example: 'Light loggers in greenhouses verify crops receive target lux-hours; shading motors react when sunlight is too harsh.' },
      { sector: 'Consumer devices', example: 'Your phone\'s auto-brightness and a smart TV\'s ambient dimming descend from the same principle (with fancier photodiodes).' },
    ],
    keyTakeaway: 'Resistance ↔ light: the simplest bridge between the physical world and a number.',
  },
  pir: {
    howItWorks:
      'Every warm body emits infrared. The PIR\'s pyroelectric crystal sits behind a faceted lens that slices the room into zones; when a heat source moves between zones, the crystal sees a changing IR pattern and generates a tiny charge. The onboard comparator turns that into a clean HIGH pulse for a few seconds.',
    signal:
      'Digital output: OUT snaps HIGH on motion, then drops after a hold time. It detects change in heat, not presence — a perfectly still person disappears to it.',
    wiring: ['VCC → 5V (most modules need 4.5V+)', 'OUT → any digital/GPIO pin', 'GND → GND'],
    industryUses: [
      { sector: 'Smart buildings', example: 'Occupancy-based lighting and HVAC — offices cut energy ~25% by letting PIR grids prove rooms are empty.' },
      { sector: 'Security', example: 'Almost every burglar alarm and outdoor security light is PIR-triggered; cameras use it to start recording only when something moves.' },
      { sector: 'Elder care', example: 'Camera-free activity monitoring: PIR sensors in each room build a daily routine model and alert when an elder\'s pattern breaks.' },
    ],
    keyTakeaway: 'PIR sees moving heat, not people — stillness is invisible to it.',
  },
  potentiometer: {
    howItWorks:
      'A resistive track with a wiper that slides along it as you turn the knob. The wiper taps a voltage anywhere between GND and VCC — a mechanical voltage divider. Turn the shaft, change the ratio, change the voltage.',
    signal:
      'Analog. The wiper voltage maps your knob angle to a number (0–1023 on the Uno). It is the canonical "first analog input".',
    wiring: [
      'One outer leg → power rail',
      'Other outer leg → GND',
      'Middle leg (wiper) → analog-in pin',
    ],
    industryUses: [
      { sector: 'Industrial controls', example: 'Machine speed dials, valve position feedback and joystick axes are potentiometers — linear versions measure actuator travel.' },
      { sector: 'Automotive', example: 'Throttle position sensors in cars were potentiometers for decades; the accelerator pedal still reads as an analog voltage.' },
      { sector: 'Prototyping', example: 'In every lab, a pot is the universal stand-in for "any analog sensor" while the real one ships.' },
    ],
    keyTakeaway: 'A pot is a voltage divider you can turn — angle in, voltage out.',
  },
  'soil-moisture': {
    howItWorks:
      'Two probes form a capacitor (capacitive type) or a resistor pair (resistive type) with soil as the medium. Water changes the soil\'s electrical properties dramatically, so wetter soil shifts the output voltage. Capacitive probes last longer — resistive ones corrode because current flows through the soil itself.',
    signal:
      'Analog: AOUT is a voltage the ADC converts to a moisture percentage after you calibrate it against dry and saturated soil.',
    wiring: [
      'VCC → 3.3V or 5V',
      'AOUT → analog-in pin',
      'GND → GND',
      'On a Raspberry Pi, add an MCP3008 ADC first',
    ],
    industryUses: [
      { sector: 'Precision agriculture', example: 'Drip-irrigation controllers across Indian farms water only when root-zone moisture drops below a crop-specific threshold — saving 30–50% water.' },
      { sector: 'Smart cities', example: 'Park and median irrigation in smart-city projects runs on soil-moisture + weather-forecast logic instead of timers.' },
      { sector: 'Research', example: 'Distributed moisture grids feed ML models predicting irrigation demand days ahead — a favourite M.Tech paper topic.' },
    ],
    keyTakeaway: 'Calibrate it: "dry" and "wet" are voltages you must measure, not constants.',
  },
  'mq2-gas': {
    howItWorks:
      'A tin-dioxide (SnO2) film sits on a tiny heater. In clean air oxygen adsorbs onto the film and traps electrons, keeping resistance high. Combustible gas molecules react with that oxygen, free the electrons, and resistance falls — so the output voltage rises with gas concentration. The heater needs ~150mA, which is why the module insists on 5V.',
    signal:
      'Analog: AOUT is a voltage the ADC reads. Real ppm values need calibration against the datasheet curve; raw thresholds ("above 400 = alarm") work for alarms.',
    wiring: ['VCC → 5V (heater current!)', 'AOUT → analog-in pin', 'GND → GND', 'Let it warm up ~60s before trusting readings'],
    industryUses: [
      { sector: 'Home safety', example: 'LPG leak detectors in kitchens across India use MQ-class sensors — the alarm threshold is set well below the explosive limit.' },
      { sector: 'Industrial monitoring', example: 'Confined-space entry monitors in factories sample for combustible gas before workers enter tanks and sewers.' },
      { sector: 'Air quality', example: 'Smoke detection in smart-city air quality nodes pairs an MQ-2 with particulate sensors to distinguish cooking smoke from fires.' },
    ],
    keyTakeaway: 'It measures resistance change of a heated film — give it 5V, give it warm-up time.',
  },
  ds18b20: {
    howItWorks:
      'A real digital thermometer chip: a silicon bandgap sensor, a 12-bit ADC and a 1-Wire interface in one package, sealed in a waterproof steel tube. Each chip ships with a unique 64-bit serial number, so many probes can share a single data wire and be addressed individually.',
    signal:
      '1-Wire digital protocol on DATA (one shared 4.7kΩ pull-up in real hardware). The board requests a conversion, waits ~750ms, then reads 12 bits of temperature — ±0.5°C accuracy, no calibration needed.',
    wiring: ['VCC → 3.3V or 5V', 'DATA → any digital/GPIO pin', 'GND → GND'],
    industryUses: [
      { sector: 'Cold chain', example: 'Refrigerated trucks thread a chain of DS18B20s through the cargo — one data wire, ten probes, per-pallet temperature history.' },
      { sector: 'Aquaculture', example: 'Fish-farm tanks monitor water temperature with the waterproof probe directly submerged — the steel tube survives years underwater.' },
      { sector: 'Server rooms', example: 'Rack inlet/outlet temperature pairs detect failing fans hours before thermal shutdown.' },
    ],
    keyTakeaway: 'One wire, many probes, each with its own address — and it is accurate out of the box.',
  },
  'servo-sg90': {
    howItWorks:
      'Inside: a DC motor, a gear train, a potentiometer on the output shaft, and a control board. The pot reports the current angle; the board compares it to the angle you asked for and drives the motor until they match — a complete closed-loop position controller for ₹150.',
    signal:
      'PWM at 50Hz: a 1ms pulse means 0°, 1.5ms means 90°, 2ms means 180°. The pulse WIDTH carries the command, not the duty cycle — which is why servo libraries exist.',
    wiring: ['VCC (red) → 5V', 'SIGNAL (orange) → a PWM pin', 'GND (brown) → GND', 'Under load, power the servo from its own 5V supply'],
    industryUses: [
      { sector: 'Robotics', example: 'Every robotic arm kit, pan-tilt camera mount and animatronic uses hobby servos — position control without writing a control loop.' },
      { sector: 'Agriculture', example: 'Automated greenhouse vents and seed-dispensing gates are servo-actuated — small motion, precise position, low power.' },
      { sector: 'Camera systems', example: 'Solar trackers and inspection cameras sweep with two servos (pan + tilt) driven by the same 50Hz PWM you generate here.' },
    ],
    keyTakeaway: 'A servo is a motor with feedback built in — you command an angle, not a speed.',
  },
  'relay-module': {
    howItWorks:
      'A small electromagnet coil sits next to a sprung metal contact. Drive IN and the coil\'s magnetic field pulls the contact over — click — closing a completely separate high-power circuit. Coil side and contact side share no wires, so 5V logic can switch 230V mains with full electrical isolation.',
    signal:
      'Digital input: IN is HIGH/LOW from any GPIO pin (most modules are active-LOW — check yours!). The module\'s transistor and flyback diode protect your pin from the coil.',
    wiring: ['VCC → 5V', 'IN → any digital/GPIO pin', 'GND → GND', 'Load side: COM + NO terminals switch the external circuit'],
    industryUses: [
      { sector: 'Agriculture', example: 'Irrigation pump controllers are a soil sensor + a relay — the entire smart-farming starter kit switches one big load.' },
      { sector: 'Building automation', example: 'Smart switchboards retrofit existing lights and geysers by putting relay modules behind the wall plate.' },
      { sector: 'Industrial control', example: 'PLCs end most output chains in a relay — the universal interface between logic and high-power machinery for 100+ years.' },
    ],
    keyTakeaway: 'The relay is galvanic isolation: the pin moves a magnet, never touches the load.',
  },
}

export function getGuide(id: ComponentId): ComponentGuide {
  return COMPONENT_GUIDES[id]
}
