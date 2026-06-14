import type { LectureModule } from '@/types/lectures'

// Unit 2 — Hardware Layer: four interactive lecture modules that replace the
// PPT. Authored content (no runtime AI calls); each module follows the same
// 4-part structure: physics from scratch → simulator wiring → code execution
// breakdown → research spark, and links back into the Virtual Lab.

export const UNIT2_MODULES: LectureModule[] = [
  // =========================================================================
  // Module 1 — Session 4
  // =========================================================================
  {
    id: 'mcu-vs-mpu',
    unit: 2,
    session: 4,
    title: 'Inside the Microcontroller',
    subtitle: 'MCU vs MPU, and how a GPIO pin really works — registers, ADCs, PWM and the three serial buses',
    icon: '🧠',
    minutes: 120,
    board: 'ESP32 DevKit',

    physics: {
      intro:
        'What separates a ₹250 microcontroller from a ₹5,000 microprocessor, what sits behind every GPIO pin, how an ADC turns a voltage into a number, and how three wires carry a conversation between chips.',
      concepts: [
        {
          heading: 'MCU vs MPU — one die versus a computer on a board',
          body:
            'An MCU (ESP32, ATmega328P) is a complete computer on one die — CPU, flash, SRAM, timers, ADC and UART share the same silicon, no OS in between. A register write changes a pin in nanoseconds; power draw is µA–mA and boot time is milliseconds.\n\nAn MPU (BCM2711 in a Raspberry Pi 4) is only a CPU + caches — RAM is a separate chip, storage is an SD card, and Linux sits between your code and the pins. You gain GHz, GB and a filesystem; you lose determinism, instant boot and the µA budget.\n\nRule of thumb: "read, decide, transmit, sleep" → MCU. Vision, databases, heavy maths → MPU. Most products use both.',
          diagram: {
            art: `        MCU (ESP32)                    MPU (Raspberry Pi 4)
  +---------------------+        +----------+   +---------+
  |  CPU  | SRAM | Flash|        | BCM2711  |   | LPDDR4  |
  |-------+------+------|        |  (CPU)   |---|  RAM    |
  | ADC | PWM | UART/I2C|        +----+-----+   +---------+
  +---------------------+             |
   one die, no OS, ~µA           SD card + Linux OS
   boots in ~10 ms               boots in ~30 s, ~3–5 W`,
            caption: 'Everything-on-one-die (MCU) versus CPU-plus-external-everything (MPU).',
          },
        },
        {
          heading: 'Anatomy of a GPIO pin — what "pinMode" physically configures',
          body:
            'The output stage is a CMOS push-pull pair: a PMOS transistor to VCC and an NMOS to ground. One conducts → pin is HIGH (sources current); the other conducts → LOW (sinks current). Finite on-resistance means a pin can only source/sink ~12–40mA — short it to a rail and it dies.\n\nThe input stage is a Schmitt trigger: on 3.3V logic it reads HIGH above ~2.0V and LOW below ~0.8V, with hysteresis so noise can\'t rattle it. An unconnected input floats between the thresholds and reads garbage — the "floating pin" failure from the Virtual Lab — which is why internal pull-up resistors (~45kΩ to VCC) exist.\n\nThree registers run all of it (AVR names, every MCU has equivalents): DDR sets direction, PORT sets output level (or enables the pull-up in input mode), PIN reads the input. pinMode() and digitalWrite() are single-bit writes into these registers.',
          diagram: {
            art: `             VCC
              |
        [PMOS]  <- ON => pin HIGH (sources current)
              |             ____
   pin o------+------------|    \\  Schmitt    to PIN
              |            |     >--trigger--> register
        [NMOS]  <- ON =>   |____/
              |   pin LOW (sinks current)
             GND
   DDR bit  -> enables PMOS/NMOS driver (output mode)
   PORT bit -> selects HIGH/LOW, or pull-up in input mode`,
            caption: 'One GPIO pin: push-pull output driver + Schmitt-trigger input.',
          },
        },
        {
          heading: 'ADC and PWM — crossing between analog and digital',
          body:
            'An ADC measures voltage by binary search. The dominant design — SAR (successive approximation register) — freezes the input on a capacitor, then asks "above half the reference?" one bit at a time. A 10-bit conversion (Uno: 0–1023) takes 10 comparisons; 12-bit (ESP32: 0–4095) takes 12. Resolution = Vref / 2^bits — the Uno resolves ≈4.9mV per count.\n\nMost MCUs fake analog output with PWM instead of a DAC: a timer counts up, a compare register holds the pin HIGH for the first N counts of each cycle — duty = N/total. Switch fast (490Hz Uno, up to 40MHz ESP32) and anything slow — an LED, a motor, an RC filter — averages the pulses into duty × VCC.\n\nThe Raspberry Pi has no on-chip ADC at all — analog sensors need an external SAR chip (MCP3008) over SPI.',
          diagram: {
            art: `SAR ADC: binary search for Vin = 2.1 V (Vref 3.3 V, 4 bits)
  step 1: Vin > 1.65 ?  yes -> bit3 = 1   (range 1.65-3.3)
  step 2: Vin > 2.475?  no  -> bit2 = 0   (range 1.65-2.475)
  step 3: Vin > 2.06 ?  yes -> bit1 = 1   (range 2.06-2.475)
  step 4: Vin > 2.27 ?  no  -> bit0 = 0   => code 1010

PWM duty 25%:   _      _      _
              _| |____| |____| |____   avg = 0.25 x VCC`,
            caption: 'SAR conversion = one comparison per bit; PWM = averaging fast pulses.',
          },
        },
        {
          heading: 'UART, I2C, SPI — three ways chips talk',
          body:
            'UART: two wires (TX→RX each way), no clock — both sides agree a baud rate, each byte framed by start/stop bits. Simple, point-to-point only.\n\nI2C: two wires, SDA (data) + SCL (clock), both open-drain with a shared pull-up — devices can only pull LOW, so nothing burns when two talk at once. The master addresses a 7-bit slave; that slave ACKs. 100–400kHz, dozens of sensors per bus. Uno: A4/A5. Pi: GPIO2/GPIO3.\n\nSPI: dedicated MOSI, MISO, SCK + one chip-select per device — full duplex, tens of MHz, no addressing. Displays, SD cards, the MCP3008 ADC.\n\nRule of thumb: UART for one neighbour, I2C for many slow sensors, SPI for few fast ones.',
          diagram: {
            art: `UART  MCU A  TX ----------> RX  MCU B   (no clock,
            RX <---------- TX          agreed baud)

I2C        VCC--[Rpull]--+--[Rpull]--VCC
  master --- SDA --------+---+--------+---
  master --- SCL ------------+--------+---
                sensor 0x76     sensor 0x23  (addressed)

SPI   master MOSI -> slave   SCK ->   MISO <-   CS ->`,
            caption: 'Point-to-point (UART), shared addressed bus (I2C), clocked full-duplex (SPI).',
          },
        },
        {
          heading: 'The power budget — why 50µA matters more than 240MHz',
          body:
            'A battery-powered node lives or dies by its energy budget, not its clock speed. An ESP32 transmitting over Wi-Fi draws ~160–260mA; idling ~40mA; light sleep ~0.8mA; deep sleep (RTC only) ~10µA. Continuous transmission empties a 2,000mAh battery in ~8 hours — a 2s-every-10-minutes duty cycle stretches the same battery to months.\n\naverage current = (t_active·I_active + t_sleep·I_sleep) / (t_active+t_sleep). Every extra awake-second is the enemy — protocol choice, sensor warm-up and even how fast your code runs are power decisions.\n\nBolt IoT (Bengaluru) builds Wi-Fi MCU platforms for exactly this pattern; C-DAC\'s SHAKTI program is building indigenous RISC-V processors for it.',
          diagram: {
            art: `Current draw, ESP32 (log scale)
  Wi-Fi TX     ~200 mA  ############################
  active CPU    ~40 mA  ######
  light sleep  ~0.8 mA  .
  deep sleep    ~10 µA  ' (RTC tick only)

2 s awake @100mA, every 600 s, else deep sleep:
  avg = (2x100000 + 598x10) / 600  =~  343 uA
  2000 mAh / 343 uA  =~  8 months`,
            caption: 'Duty-cycling turns an 8-hour battery into an 8-month one.',
          },
        },
      ],
    },

    wiring: {
      intro:
        'An ESP32 reading a DHT11 (temperature + humidity, digital one-wire) and an LDR (light, analog) — the pattern behind the Nashik vineyard nodes.',
      diagram: {
        art: `        ESP32 DevKit
       +--------------+
  3V3 -|3V3        GND|- GND
       |              |
GPIO4 -|GPIO4   GPIO34|- ADC1_CH6
       +--------------+
         |    |          |
       DATA  3V3---+    signal
         |    |     \\     |
      +--DHT11--+   [ LDR divider ]
      | VCC GND |    VCC      out
      +---------+

DHT11:  VCC->3V3   GND->GND   DATA->GPIO4
LDR:    VCC->3V3   signal->GPIO34 (ADC, input-only)`,
        caption: 'One digital one-wire sensor (DHT11) + one analog divider (LDR) on the ESP32.',
      },
      steps: [
        { from: 'ESP32 3V3', to: 'DHT11 VCC', purpose: 'Supply rail. The DHT11 tolerates 3–5.5V; on the ESP32 we use 3.3V so its DATA line idles at a level the 3.3V GPIO can safely read.' },
        { from: 'ESP32 GND', to: 'DHT11 GND', purpose: 'Return path — completes the current loop. No GND, no circuit (the open-circuit failure you saw in the lab).' },
        { from: 'DHT11 DATA', to: 'ESP32 GPIO4', purpose: 'Single-wire digital bus. The MCU pulls it low to request a reading; the sensor answers with timed pulses (26–28µs = 0, 70µs = 1).' },
        { from: 'ESP32 3V3', to: 'LDR Leg 1 (VCC)', purpose: 'Top of the voltage divider. The LDR\'s resistance (≈200kΩ dark → ≈1kΩ bright) sets how much of the 3.3V appears at the output node.' },
        { from: 'LDR Leg 2 (signal)', to: 'ESP32 GPIO34', purpose: 'Divider midpoint into an ADC1 pin. GPIO34 is input-only with a 12-bit SAR ADC behind it — brighter light, higher count (0–4095).' },
      ],
      labChallengeId: 'weather-station',
      labNote:
        'Open the Virtual Lab → ESP32 DevKit and complete the "Hostel-Room Weather Station" challenge — it checks this exact circuit. Then deliberately move the LDR wire to GPIO23 (no ADC) and Run Anyway to watch the analog-on-digital failure before fixing it.',
    },

    code: {
      language: 'cpp',
      listing: `// Session 4 — ESP32 weather node: DHT11 + LDR, CSV to serial.
// Paste into Wokwi (ESP32 DevKit v1) or Arduino IDE as-is.
#include "DHT.h"

#define DHT_PIN   4        // GPIO4  — DHT11 one-wire data
#define DHT_TYPE  DHT11
#define LDR_PIN   34       // GPIO34 — ADC1_CH6, input-only

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);            // UART0 at 115200 baud
  dht.begin();                     // releases the data line (pull-up)
  analogReadResolution(12);        // ESP32 SAR ADC: counts 0..4095
  Serial.println("temp_c,humidity_pct,light_raw");
}

void loop() {
  float t = dht.readTemperature();   // blocking ~25 ms bit-banged read
  float h = dht.readHumidity();      // served from the same 5-byte frame
  int light = analogRead(LDR_PIN);   // one 12-bit SAR conversion

  if (isnan(t) || isnan(h)) {        // checksum failed / sensor not ready
    Serial.println("ERROR,sensor_read_failed");
  } else {
    Serial.printf("%.1f,%.1f,%d\\n", t, h, light);
  }
  delay(5000);                       // DHT11 needs >= 1 s between reads
}`,
      walkthrough: [
        {
          lines: 'Lines 12–15 (setup)',
          heading: 'Serial.begin — programming a baud-rate divisor',
          body:
            'Serial.begin(115200) writes a clock-divider value into UART0\'s configuration register so the 80MHz peripheral clock is divided down to exactly 115,200 bit-slots per second. From now on, every byte you print is loaded into a hardware FIFO; the UART shifts it out start-bit-first while your code carries on running. analogReadResolution(12) sets how many successive-approximation steps the SAR performs per conversion.',
        },
        {
          lines: 'Line 19 (dht.readTemperature)',
          heading: 'A bit-banged one-wire conversation',
          body:
            'The library flips GPIO4 to output, pulls it LOW for 20ms — the "speak now" request — then flips the pin back to input and hands the line to the sensor via the pull-up. The DHT11 answers with 40 pulses; the MCU busy-waits in a tight loop, timing each HIGH period with the CPU cycle counter: ~27µs means 0, ~70µs means 1. Five bytes arrive — humidity, temperature, checksum — and the final byte must equal the sum of the first four, or the library returns NaN. This is why line 23 checks isnan(): a checksum failure is detected, not silent.',
        },
        {
          lines: 'Line 21 (analogRead)',
          heading: 'Twelve comparisons in the SAR',
          body:
            'analogRead(34) routes ADC1 channel 6 to the sample-and-hold capacitor, lets it charge to the divider voltage for a few microseconds, then runs the binary search you saw in the physics section — 12 comparator decisions, MSB first — and returns the 12-bit code. At 3.3V reference each count is ~0.8mV. Note the ESP32\'s ADC is famously non-linear near the rails; serious designs calibrate against a known voltage (a Session 5 theme).',
        },
        {
          lines: 'Lines 23–27 (printf + CSV)',
          heading: 'Why CSV from the firmware side',
          body:
            'Structured output is an interface contract: any tool — the serial plotter, a Python pandas script, a cloud ingester — can parse "24.3,61.0,2987" without bespoke code. The printf call formats into a RAM buffer, then queues bytes into the UART FIFO; at 115,200 baud a 20-character line occupies the wire for ~1.7ms, all spent in hardware, not your loop.',
        },
        {
          lines: 'Line 28 (delay)',
          heading: 'delay() is the power-budget villain',
          body:
            'delay(5000) burns 5 seconds at full ~40mA — the CPU spins doing nothing. The production version replaces it with esp_deep_sleep(5e6): RAM powers down, the RTC timer wakes the chip at ~10µA, and your battery life multiplies by three orders of magnitude. That single substitution is the entire research spark below.',
        },
      ],
    },

    research: {
      title: 'Adaptive duty-cycling for vineyard sensor nodes',
      brief:
        'The Nashik deployment samples every 10 minutes, always. But soil moisture changes slowly at night and fast during irrigation. Design an ESP32 node whose sampling rate adapts to the signal\'s rate of change (e.g., a Kalman-predicted error bound), spending its energy only when information is actually arriving.',
      objectives: [
        'Model node energy: measure real current in active / light-sleep / deep-sleep states and build a per-sample energy cost function',
        'Implement adaptive sampling (prediction-error driven) on-device, comparing against fixed 1-min and 10-min baselines',
        'Quantify the information-vs-energy trade-off: reconstruction RMSE of the soil-moisture curve per joule consumed',
        'Field-test seasonal battery-life projection for a 2,000mAh LiFePO4 cell',
      ],
      constraints: [
        'Total awake time < 2s per wake cycle including sensor warm-up',
        'Deep-sleep floor current must stay below 50µA (audit every external component\'s leakage)',
        'No cloud-side intelligence — the adaptation logic must fit in the MCU\'s RTC memory across sleep cycles',
      ],
    },
  },

  // =========================================================================
  // Module 2 — Session 5
  // =========================================================================
  {
    id: 'sensors-deep-dive',
    unit: 2,
    session: 5,
    title: 'Sensors Deep Dive',
    subtitle: 'Transduction physics, the accuracy/precision/resolution triangle, calibration math and sensor fusion',
    icon: '🌡️',
    minutes: 120,
    board: 'Arduino Uno',

    physics: {
      intro:
        'A sensor is a transducer: it converts a physical quantity into an electrical one. Everything downstream — ADC counts, dashboards, ML models — inherits the physics of that conversion.',
      concepts: [
        {
          heading: 'Transduction — how physics becomes voltage',
          body:
            'Resistive sensors change resistance: an LDR\'s resistance falls with light, a thermistor\'s with heat, a soil probe\'s with moisture. Wrap the element in a voltage divider — Vout = VCC × R2/(R1+R2) — and the ADC reads Vout. That\'s why an LDR module has three pins, not two.\n\nCapacitive sensors (DHT11 humidity, capacitive soil probes) change capacitance — the chip times how fast the capacitor charges. No metal touches the electrolyte, so they outlive resistive probes.\n\nPiezoelectric sensors generate charge under mechanical stress — the HC-SR04\'s discs emit 40kHz ultrasound and the echo strains the receiver into a measurable voltage. Photodiodes, Hall elements, thermopiles: every sensor family is one of a handful of physical effects in different packaging.',
          diagram: {
            art: `Voltage divider — the universal resistive-sensor circuit
        VCC (5 V)
          |
        [ R1 ]  fixed 10 kΩ
          |
          +-------o  Vout = VCC * Rldr/(R1+Rldr) -> ADC
          |
        [ Rldr ] 1 kΩ bright ... 200 kΩ dark
          |
         GND
 bright: Vout ≈ 5*1/(11)  ≈ 0.45 V -> low count
 dark:   Vout ≈ 5*200/210 ≈ 4.76 V -> high count`,
            caption: 'The divider converts a resistance change into the voltage your ADC needs.',
          },
        },
        {
          heading: 'Infrared proximity — emitter, phototransistor and the comparator that decides',
          body:
            'The purple IR module on your bench has two domes: one is an IR LED (≈940nm, invisible to your eyes but your phone camera can see it glow), the other is a phototransistor. The LED is wired on continuously (or pulsed) and floods the area in front of it with infrared. The phototransistor is a normal transistor whose base current is generated by photons instead of a wire — more IR hitting it means more electron-hole pairs generated in its base-collector junction, so more current flows collector-to-emitter.\n\nPlace a reflective object in front: IR bounces back, the phototransistor conducts harder, and the voltage across its pull-up/pull-down resistor swings. An onboard comparator (an LM393, the same chip family as the line-follower and rain-sensor modules) compares that voltage against a threshold set by the trimmer pot, and snaps its output HIGH or LOW — turning an analog brightness into a clean digital "object / no object" signal the MCU can digitalRead() in one instruction.\n\nThis exact emitter-receiver-comparator triplet, just re-tuned, is the TV remote receiver, the smartphone\'s "screen off near your ear" proximity sensor, and the beam-break sensor at a factory conveyor.',
          diagram: {
            art: `IR obstacle sensor — emitter, receiver, comparator
   IR LED (940nm) --->>>  ~ ~ ~ ~ ~ >  [ object ]
        ^                              | reflects
        | always on / pulsed           v
   phototransistor  <~ ~ ~ ~ ~ ~ ~ ~ ~ +
        |  more IR -> more Ic -> Vsense changes
   [ LM393 comparator ] -- vs trimmer threshold -->  digital OUT
        far: OUT = HIGH (clear)   near: OUT = LOW (obstacle)`,
            caption: 'Photons generate carriers in the phototransistor; the comparator turns that analog swing into a clean 0/1.',
          },
        },
        {
          heading: 'MEMS — how a chip "feels" acceleration and rotation (the MPU6050)',
          body:
            'The MPU6050 packs an accelerometer and a gyroscope onto one silicon die using MEMS (Micro-Electro-Mechanical Systems) — structures etched directly into the chip, a few micrometres across, that actually move.\n\nThe accelerometer is a tiny proof mass suspended by silicon springs, with comb-like fingers that interleave with fixed fingers anchored to the substrate — a capacitor whose capacitance depends on the gap. Tilt or accelerate the chip and the mass shifts a few nanometres relative to the fixed fingers; the capacitance changes; on-chip electronics convert that into a digital value proportional to g (±2g to ±16g, selectable).\n\nThe gyroscope uses the same comb-capacitor trick, but the proof mass is kept continuously vibrating. When the chip rotates, the Coriolis force (F = -2m·ω×v) deflects the vibrating mass sideways, perpendicular to both its vibration and the rotation axis — and that sideways deflection is what the capacitor senses. No spinning wheels, no liquid — just a vibrating silicon comb and the same Coriolis effect that curves cyclones and artillery shells.\n\nBoth sensors talk over I2C (SDA/SCL — the same bus as Module 1\'s "many slow sensors" pattern), reporting six 16-bit numbers (3-axis accel + 3-axis gyro) plus an onboard temperature, 8000 times a second if you ask for it.\n\nThis same chip family is why a drone can hover (the gyro feeds a stabilisation loop hundreds of times a second), why your phone\'s screen rotates and step-counter works, why a car\'s airbag controller knows it has been hit, and why structural-health teams glue these onto bridge girders to catch resonance before cracks do.',
          diagram: {
            art: `Accelerometer: comb capacitor on springs
  fixed fingers  | | | | |        tilt/accel -> mass shifts
  moving fingers  |#|#|#|#|  <-->  -> gap changes -> C changes
       (proof mass on silicon springs)        -> voltage out

Gyroscope: Coriolis on a vibrating mass
  mass vibrates left<->right continuously
  chip rotates (omega) -> Coriolis force F = -2m(omega x v)
  -> mass also deflects FRONT<->BACK, sensed by a 2nd comb`,
            caption: 'Two comb capacitors, one vibrating — accelerometer and gyroscope on a single die.',
          },
        },
        {
          heading: 'Accuracy vs precision vs resolution vs range — four different promises',
          body:
            'Accuracy is closeness to the truth — a DHT11\'s ±2°C means 25.0°C could be anywhere from 23 to 27. Precision is repeatability: a sensor can be precise and consistently wrong (calibration fixes that; imprecision is not fixable).\n\nResolution is the smallest step the system can represent, set by the weakest link — the DHT11 reports whole degrees; a 10-bit ADC on 5V can\'t see below ~4.9mV. More ADC bits never add accuracy.\n\nRange is where the promises hold — a DHT11 at 55°C (range 0–50°C) doesn\'t fail loudly, it just lies. Choosing the DHT22 vs the BME280 for a weather station is this trade-off made concrete: accuracy, resolution, bus, power — not a spec-sheet beauty contest.',
          diagram: {
            art: `        accurate+precise   precise, not accurate
             .  x x            x x
            ( o )  x          ( o )      x x   <- tight but
             '  x                          x      offset: CALIBRATE
        accurate, not precise  neither
              x   .  x            x     x
             x  ( o )                ( o )   x
                 x   x            x      x`,
            caption: 'The target diagram: o = true value, x = your readings.',
          },
        },
        {
          heading: 'Noise, drift, and two-point calibration',
          body:
            'Noise is random sample-to-sample variation — thermal agitation, supply ripple, EM pickup. Random with mean zero, so averaging N samples shrinks its spread by √N: 16 readings → noise halved twice over, for free.\n\nDrift is slow systematic change in the sensor itself — corrosion, dust, ageing. Averaging can\'t remove it; only recalibration can.\n\nTwo-point calibration: measure raw in two known conditions (probe in air = 0%, in water = 100%), then map linearly — solving y = mx + c from two anchors corrects both offset and scale at once.',
          diagram: {
            art: `Noise (random):  averaging N samples -> sigma / sqrt(N)
Drift (slow, systematic): only recalibration fixes it

Two-point calibration — y = mx + c from two anchors:
  raw_dry  (in air)   --> 0 %
  raw_wet  (in water) --> 100 %

  value = (raw - raw_dry) * 100 / (raw_wet - raw_dry)`,
            caption: 'Averaging kills noise; only re-anchoring the two endpoints kills drift.',
          },
        },
        {
          heading: 'Sensor fusion — why Apollo\'s wards alarm 60% less',
          body:
            'Every sensor lies differently. GPS gives absolute position but wanders metre-scale and dies indoors; an accelerometer integrates beautifully short-term but drifts over a minute; a barometer nails relative altitude but wanders with weather. Fusion trusts the fast sensor briefly and the slow sensor for the long run.\n\nThe complementary filter: estimate = α·(fast) + (1−α)·(slow), α ≈ 0.98 for gyro+accelerometer. A Kalman filter generalises this, weighting each source by its variance.\n\nApollo Hospitals: an SpO2 dip alone might be a loose clip; SpO2 dip + tachycardia + the patient motionless is an emergency. Requiring agreement across independent sensors cut false alarms ~60%.',
          diagram: {
            art: `fast sensor (accel) --\\
                       >--  estimate = a*fast + (1-a)*slow
slow sensor (GPS/baro)-/        (a =~ 0.98)

Apollo logic:
  SpO2 dip alone            -> maybe just a loose clip
  SpO2 dip + ECG tachycardia
            + accel: still   -> agreement => real alarm`,
            caption: 'Fusion = trusting different sensors at different timescales, or requiring agreement.',
          },
        },
      ],
    },

    wiring: {
      intro:
        'One clean analog source (potentiometer) and one messy real sensor (LDR) on the Uno\'s 10-bit ADC. The pot teaches the transfer function; the LDR gets the calibration treatment.',
      diagram: {
        art: `        Arduino Uno
       +------------+
  5V --|5V       GND|-- GND
       |            |
  A0 --|A0        A1|-- (LDR signal)
       +------------+
   |        |          |
  wiper    5V----+    out
   |        |     \\     |
+--POT------+   [ LDR divider ]
| VCC GND |      VCC      GND
+---------+

POT:  VCC->5V  GND->GND  wiper->A0
LDR:  VCC->5V  signal->A1 (10-bit ADC, 0-1023)`,
        caption: 'A clean reference channel (pot) next to a noisy real one (LDR), read together.',
      },
      steps: [
        { from: 'Uno 5V', to: 'Potentiometer VCC', purpose: 'Top of the pot\'s internal divider — the wiper will sweep between this rail and GND.' },
        { from: 'Uno GND', to: 'Potentiometer GND', purpose: 'Bottom of the divider and the ADC\'s reference ground — both must share this node or counts are meaningless.' },
        { from: 'Potentiometer Wiper', to: 'Uno A0', purpose: 'The wiper voltage (0–5V) into ADC channel 0: full-range, low-noise — your ground truth for verifying ADC behaviour.' },
        { from: 'Uno 5V', to: 'LDR Leg 1 (VCC)', purpose: 'Feeds the LDR divider; with light the LDR\'s falling resistance pulls the output node up.' },
        { from: 'LDR Leg 2 (signal)', to: 'Uno A1', purpose: 'Second ADC channel — sampled in the same loop so you can watch a noisy channel beside a clean one.' },
      ],
      labChallengeId: 'knob-reader',
      labNote:
        'In the Virtual Lab, complete "Knob Reader" on the Arduino Uno, then add the LDR on A1. Try wiring the wiper to D8 instead of A0 and Run Anyway — the analog-on-digital failure shows you exactly why ADC channels are special.',
    },

    code: {
      language: 'cpp',
      listing: `// Session 5 — ADC characterisation + two-point calibration + filtering.
// Arduino Uno: pot wiper on A0, LDR divider output on A1.
const int POT_PIN = A0;
const int LDR_PIN = A1;

// Two-point calibration anchors for the LDR channel.
// Measure once: raw value in darkness and under your desk lamp.
const int RAW_DARK   = 80;    // ADC count, sensor covered
const int RAW_BRIGHT = 920;   // ADC count, lamp at 20 cm

// Oversample-and-average: noise sigma shrinks by sqrt(N).
int readAveraged(int pin, int n = 16) {
  long sum = 0;
  for (int i = 0; i < n; i++) sum += analogRead(pin);  // ~112 µs each
  return (int)(sum / n);
}

// Map a raw count onto the calibrated 0-100 % scale.
float calibrate(int raw) {
  float pct = 100.0 * (raw - RAW_DARK) / (RAW_BRIGHT - RAW_DARK);
  return constrain(pct, 0.0, 100.0);   // clamp outside the anchors
}

void setup() {
  Serial.begin(115200);
  Serial.println("pot_raw,pot_volts,light_raw,light_pct");
}

void loop() {
  int pot   = readAveraged(POT_PIN);
  int light = readAveraged(LDR_PIN);
  float volts = pot * 5.0 / 1023.0;        // 10-bit transfer function

  Serial.print(pot);          Serial.print(',');
  Serial.print(volts, 3);     Serial.print(',');
  Serial.print(light);        Serial.print(',');
  Serial.println(calibrate(light), 1);
  delay(200);
}`,
      walkthrough: [
        {
          lines: 'Lines 12–16 (readAveraged)',
          heading: 'Oversampling — buying precision with time',
          body:
            'Each analogRead on the Uno starts a SAR conversion clocked at 125kHz: 13 ADC clock cycles ≈ 104µs of successive approximation. Sixteen reads cost ~1.8ms and return the mean; random noise of σ ≈ 3 counts collapses to σ/√16 ≈ 0.75 counts. Watch both columns in the serial plotter: the averaged LDR trace is visibly calmer than a single-shot version. Averaging does nothing to the offset error — that is calibration\'s job, not filtering\'s.',
        },
        {
          lines: 'Lines 19–22 (calibrate)',
          heading: 'The two-point map is just y = mx + c',
          body:
            'The expression rescales the line through (RAW_DARK, 0%) and (RAW_BRIGHT, 100%): slope m = 100/(RAW_BRIGHT−RAW_DARK), intercept −m×RAW_DARK. Note the deliberate float promotion (100.0) — in integer math the division would truncate to 0 or 100. constrain() handles readings outside the anchors: brighter than your lamp clamps to 100 instead of reporting 113%, an honest admission that the calibration is only valid between its anchor points.',
        },
        {
          lines: 'Line 31 (volts conversion)',
          heading: 'The ADC transfer function, stated explicitly',
          body:
            'count = round(Vin × 1023 / Vref) and therefore Vin ≈ count × 5.0/1023. Turn the pot knob slowly: counts step by 1, i.e. 4.9mV — you are watching resolution as a physical staircase. If your USB port actually supplies 4.8V rather than 5.0V, every "volt" you print is ~4% high: the reference IS part of the measurement chain, the most common silent error in student data.',
        },
        {
          lines: 'Lines 33–37 (CSV output)',
          heading: 'Clean channel beside dirty channel',
          body:
            'Logging the pot (controlled truth) next to the LDR (uncontrolled reality) is a deliberate experimental design: any wobble common to both columns is supply/reference noise; wobble only on the LDR column is optical or sensor noise. That separation-of-error-sources habit is exactly what the Session 5 datasheet assignment is training.',
        },
      ],
    },

    research: {
      title: 'Self-recalibrating soil sensors via contextual fusion',
      brief:
        'Resistive soil probes drift as electrodes corrode — the reason for annual manual recalibration across hundreds of field nodes. Build a node that re-anchors its own calibration: after rainfall events (detected from open weather data or a co-located rain sensor) soil approaches field capacity — a known physical state usable as a free calibration point.',
      objectives: [
        'Instrument drift: log a resistive and a capacitive probe side-by-side for 8+ weeks and characterise divergence over time',
        'Implement event-triggered re-anchoring (post-rain saturation = recurring reference point) in node firmware',
        'Fuse probe data with ambient temperature/humidity to separate true moisture change from temperature-induced sensor error',
        'Evaluate against weekly gravimetric ground-truth samples; report calibration error vs the static two-point baseline',
      ],
      constraints: [
        'The recalibration must run on-node (no cloud round-trip) and persist anchors in flash across power loss',
        'Quantify and bound the failure mode: what happens to the anchor if a rain event is falsely detected?',
        'Total node cost must stay under ₹1,500 to remain relevant to smallholder deployment',
      ],
    },
  },

  // =========================================================================
  // Module 3 — Session 6
  // =========================================================================
  {
    id: 'actuators-real-output',
    unit: 2,
    session: 6,
    title: 'Actuators & Real Output',
    subtitle: 'Relays, MOSFETs, motors and flyback diodes — closing the loop from sensing to acting safely',
    icon: '⚙️',
    minutes: 120,
    board: 'Arduino Uno',

    physics: {
      intro:
        'Sensing is half of IoT — the value is in acting. But a GPIO pin delivers ~20mA at 5V, and actuators are power components. This is the physics of switching real loads without destroying the controller.',
      concepts: [
        {
          heading: 'The current chasm — why a pin cannot drive a motor',
          body:
            'A GPIO\'s CMOS transistors have on-resistance of tens of ohms and a thermal limit near 20–40mA. A relay coil wants 70mA, a small DC motor 200mA–1A (amps at stall). Connect either directly and the pin becomes the fuse.\n\nThe universal pattern is staged amplification: the pin switches a transistor, the transistor switches the load, and a separate rail carries the load current. The pin charges a transistor input — µA to mA — while the load draws amps from a supply built for it.\n\nThis also isolates voltage domains: a 3.3V pin can switch a 12V motor or, through a relay, 230V mains. Every motor driver IC, relay board and LED-strip driver is this one idea in packaging.',
          diagram: {
            art: `GPIO pin limit: ~20-40 mA
  relay coil   needs ~70 mA    |==> too much
  DC motor     needs 0.2-1 A   |==> way too much

Staged amplification:
 GPIO --(uA-mA, charges gate)--> [transistor] --(amps)--> LOAD
                                       ^
                              separate power rail`,
            caption: 'The pin never carries the load current — it only switches a transistor that does.',
          },
        },
        {
          heading: 'The MOSFET as a switch — gate charge, Rds(on) and "logic-level"',
          body:
            'A MOSFET is a voltage-controlled switch: the gate is an insulated capacitor — charge it above the threshold voltage and a conductive channel opens between drain and source. No steady gate current flows, just a pulse of charge per edge.\n\nThe key number is Rds(on), the on-resistance: a logic-level FET (IRLZ44N) reaches ~0.025Ω at 5V gate drive — at 2A that\'s only 0.1W. The classic trap is the IRF540 (not logic-level): at 5V it\'s only half-on, Rds(on) is tens of times higher, and it cooks. "Logic-level" = fully on at 3.3–5V.\n\nLow-side: the FET sits between load and ground, with a 10kΩ gate-to-ground resistor so the load stays off while the MCU boots. PWM into the gate gives proportional control.',
          diagram: {
            art: `Low-side MOSFET switch with flyback diode
                 +12 V
                   |
              +----+----+
              |  MOTOR  |   <-- inductive load
              +----+----+
        flyback    |       cathode to +12V
        diode  [<|]+        (1N5408 across the load)
                   |
GPIO --[220Ω]-- G [MOSFET]  IRLZ44N (logic-level)
                   | D->S
            [10kΩ] |        gate pull-down: off at boot
              |    |
             GND  GND`,
            caption: 'Pin charges the gate; the load\'s amps flow 12V→motor→FET→GND.',
          },
        },
        {
          heading: 'Inductive kickback — the flyback diode is not optional',
          body:
            'Coils store energy in a magnetic field: E = ½LI². V = L·di/dt means interrupting the current instantly forces di/dt → huge — the coil generates whatever voltage it takes to keep current flowing. Switch off a relay coil with a bare transistor and the coil swings to hundreds of volts, through your switching device.\n\nThe flyback diode is the escape route: across the coil, invisible in normal operation, it becomes forward-biased the instant the switch opens — the current recirculates and decays harmlessly. One ₹2 diode versus one dead MOSFET.\n\nRelays add isolation too: coil and contacts are mechanically linked but electrically separate, so a 5V coil can switch 230V mains. Mains designs add an optocoupler before the transistor for the same reason.',
          diagram: {
            art: `Switch OFF, no flyback diode:
  V = L di/dt,  di/dt -> huge  =>  spike: hundreds of volts

With flyback diode across the coil:
   +12V ---[ COIL ]---+
                |      |
              [<-|]----+  <- diode recirculates the current
                |
   switch ------+------ GND
   (spike clamped to ~1V, current decays in the winding)`,
            caption: 'The diode is invisible until the switch opens — then it saves the transistor.',
          },
        },
        {
          heading: 'Servo motors — a pulse width becomes a shaft angle',
          body:
            'A hobby servo is not "just a motor" — it is a small DC motor, a reduction gearbox, a potentiometer and a tiny control IC, all sealed in one box, forming a complete closed loop in hardware. The only wires out are power, ground and one signal pin.\n\nThe signal is a pulse repeated every 20ms (50Hz); the pulse\'s width tells the servo where to point — 1ms ≈ 0°, 1.5ms ≈ 90° (centre), 2ms ≈ 180°. Inside, the control IC converts that pulse width into a target voltage and compares it against the voltage from a potentiometer mechanically linked to the output shaft — the pot IS the feedback sensor. If target ≠ position, the IC drives the DC motor (through its own tiny H-bridge) toward the target; as the gear train turns the shaft, the pot voltage changes too, and the motor stops the instant they match.\n\nThis is the same staged-amplification idea from this module\'s first concept, just packaged: your GPIO pin only ever drives the signal line at µA levels — the motor\'s amps are entirely the servo\'s internal battery-rail problem.',
          diagram: {
            art: `Servo control: 20 ms frame, pulse width = angle
  |--1.0ms--|______________________|  -> 0 degrees
  |--1.5ms------|__________________|  -> 90 degrees (centre)
  |--2.0ms----------|______________|  -> 180 degrees
            <---------- 20 ms ---------->

Inside the servo (closed loop in a box):
  signal pulse -> [control IC] -> target voltage
  pot (on shaft) -> position voltage  --\\
  target != position -> drive motor ----/  until they match`,
            caption: 'The MCU only sets a target; the servo\'s own pot-and-motor loop does the work of getting there.',
          },
        },
        {
          heading: 'The L298N H-bridge — four switches give a DC motor a direction',
          body:
            'A plain transistor (this module\'s MOSFET concept) can only switch a motor on/off in one direction — current always flows the same way through it. To reverse a motor you need to reverse which way current flows through it, and that takes four switches arranged in an "H" with the motor as the crossbar — an H-bridge. The L298N chip contains two complete H-bridges (one per motor) built from Darlington transistor pairs, plus the flyback diodes from the previous concept already built in.\n\nTo spin the motor forward: turn ON the top-left and bottom-right switches (IN1=HIGH, IN2=LOW). Current flows from the 12V motor-supply rail, through the top-left switch, left-to-right through the motor, through the bottom-right switch, to ground. To reverse, turn ON the opposite diagonal (IN1=LOW, IN2=HIGH) — now current flows right-to-left through the same motor. The ENA pin is PWM\'d to chop this current on and off thousands of times a second; the motor\'s inertia averages the chopped current into a slower or faster spin — the same duty-cycle idea as Module 1\'s PWM, now controlling watts instead of an LED.\n\nCritically, the L298N has two separate power inputs: 5V logic (from the Arduino) for the tiny IN1/IN2/ENA signals, and a separate 6–12V motor rail for the amps that actually spin the motor. Wiring the motor rail to the board\'s 5V pin starves the motor and can brown out the whole board — the Virtual Lab will warn you about exactly this.',
          diagram: {
            art: `H-bridge inside the L298N (one channel)
        +12V (motor supply, separate from logic 5V)
         |                  |
   IN1--[SW A]        [SW C]--IN2 (opposite state to IN1)
         |    MOTOR     |
         +----( M )-----+
         |              |
   IN1--[SW B]        [SW D]--IN2
         |                  |
        GND                GND

Forward: SW A + SW D on -> current L->R through motor
Reverse: SW B + SW C on -> current R->L through motor
ENA = PWM -> chops the current -> controls speed`,
            caption: 'Two diagonal switch-pairs give the same motor two directions; PWM on ENA gives it speed.',
          },
        },
        {
          heading: 'Closing the loop — hysteresis or the system chatters',
          body:
            'A complete IoT loop is sense → decide → act → (the action changes what you sense). "Pump ON if moisture < 40%" fails: noise of ±1% near the threshold switches the pump on/off several times a minute — chattering — which destroys relays (~100k cycle rating) and pumps.\n\nThe fix is the Schmitt trigger\'s hysteresis, in software: ON below 35%, OFF above 45%. Inside that dead band the actuator holds its previous state.\n\nReal deployments add time guards too — minimum on/off time, daily cycle budgets — because sensors fail, and a failed sensor must fail safe.',
          diagram: {
            art: `Naive: pump ON if moisture < 40%  -> chatters at 40%

Hysteresis (dead band 35-45%):
  moisture < 35%  -> pump ON
  moisture > 45%  -> pump OFF
  35-45%          -> hold previous state

 45% ----.________          ________
 35% ----'        \\________/
         ON  (hold)   OFF    (hold)  ON`,
            caption: 'A dead band means one decision needs the signal to cross the whole gap.',
          },
        },
      ],
    },

    wiring: {
      intro:
        'The parking assistant: an HC-SR04 measures distance, the Uno decides, a buzzer and LED act — sensor → decision → actuator on one bench. (The buzzer\'s current is pin-safe; the decision logic is identical to a MOSFET-driven load.)',
      diagram: {
        art: `        Arduino Uno
       +----------------+
  5V --|5V            GND|-- GND
       |                 |
  D9 --|D9~  D8  D5~  D3~|
       +--|----|----|----|--+
          |    |    |    |
       TRIG  ECHO  BUZZ  220R--LED--+
          |    |    |    |          |
       +--HC-SR04---+   GND        GND
       | VCC=5V GND |
       +------------+

HC-SR04: VCC->5V, GND->GND, TRIG->D9, ECHO->D8
Buzzer:  +->D5(~)  -->GND
LED:     D3(~) -> 220R -> anode, cathode -> GND`,
        caption: 'One ranging sensor in, two actuators out — distance becomes sound and light.',
      },
      steps: [
        { from: 'Uno 5V', to: 'HC-SR04 VCC', purpose: 'The HC-SR04\'s piezo driver genuinely needs 5V — on 3.3V its ultrasonic burst is too weak for reliable echoes (the undervoltage failure in the lab).' },
        { from: 'Uno GND', to: 'HC-SR04 GND', purpose: 'Common reference for the TRIG/ECHO timing signals.' },
        { from: 'Uno D9', to: 'HC-SR04 TRIG', purpose: 'Output: a 10µs HIGH pulse commands one 8-cycle 40kHz ultrasonic burst.' },
        { from: 'HC-SR04 ECHO', to: 'Uno D8', purpose: 'Input: ECHO goes HIGH while the sound is in flight; the pulse width IS the distance measurement.' },
        { from: 'Uno D5 (~)', to: 'Buzzer +', purpose: 'PWM-capable pin drives the warning tone; duty/burst rate encodes urgency.' },
        { from: 'Buzzer −', to: 'Uno GND', purpose: 'Return path for the buzzer current (~15mA — within pin limits, no driver stage needed).' },
        { from: 'Uno D3 (~) → 220Ω → LED anode, LED cathode → GND', to: '(three taps in the lab)', purpose: 'Visual channel: PWM brightness rises as the car gets closer. The resistor limits LED current — Module 1\'s lesson, permanently.' },
      ],
      labChallengeId: 'parking-sensor',
      labNote:
        'Complete "Campus Parking Sensor" in the Virtual Lab (Arduino Uno). Then sabotage it on purpose: power the HC-SR04 from 3.3V and Run Anyway — the undervoltage flicker you see is exactly the field failure the 5V requirement prevents.',
    },

    code: {
      language: 'cpp',
      listing: `// Session 6 — parking assistant: HC-SR04 in, buzzer + LED out,
// with software hysteresis so the alarm never chatters.
const int TRIG_PIN = 9;
const int ECHO_PIN = 8;
const int BUZZ_PIN = 5;   // PWM ~
const int LED_PIN  = 3;   // PWM ~

const float ALARM_ON_CM  = 30.0;  // closer than this -> alarm ON
const float ALARM_OFF_CM = 45.0;  // farther than this -> alarm OFF
bool alarmOn = false;             // state held inside the dead band

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);  // fire burst
  digitalWrite(TRIG_PIN, LOW);
  // ECHO high-time = round-trip flight time (timeout 25 ms ~ 4 m)
  long us = pulseIn(ECHO_PIN, HIGH, 25000UL);
  if (us == 0) return -1.0;             // no echo: open road / timeout
  return us * 0.0343f / 2.0f;           // speed of sound, there & back
}

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  Serial.begin(115200);
}

void loop() {
  float cm = readDistanceCm();

  if (cm > 0) {
    // Hysteresis: two thresholds, state remembered between them.
    if (!alarmOn && cm < ALARM_ON_CM)  alarmOn = true;
    if ( alarmOn && cm > ALARM_OFF_CM) alarmOn = false;

    // Proportional urgency on both output channels.
    int level = constrain(map((int)cm, 5, 60, 255, 0), 0, 255);
    analogWrite(LED_PIN, level);                 // brighter = closer
    analogWrite(BUZZ_PIN, alarmOn ? level : 0);  // tone only when ON
    Serial.print(cm, 1); Serial.print(" cm  alarm=");
    Serial.println(alarmOn ? "ON" : "off");
  }
  delay(60);   // ~16 Hz: faster than a reversing car needs
}`,
      walkthrough: [
        {
          lines: 'Lines 13–21 (readDistanceCm)',
          heading: 'pulseIn — measuring time of flight with a busy-wait',
          body:
            'The 10µs TRIG pulse makes the module emit eight 40kHz piezo cycles. ECHO then goes HIGH and stays HIGH until the reflection returns. pulseIn() spins reading the pin register, counting CPU cycles between the rising and falling edge — at 16MHz, resolution is well under a microsecond. Distance = time × 343m/s ÷ 2 (the sound travels there AND back; forgetting the ÷2 doubles every reading — a classic viva question). The 25ms timeout matters: with no obstacle, ECHO would stay high ~200ms and your loop would stall.',
        },
        {
          lines: 'Lines 34–36 (hysteresis)',
          heading: 'Two thresholds and a state variable',
          body:
            'This is the Schmitt trigger reborn in software. alarmOn only flips when distance crosses the FAR side of each threshold: a car parked at exactly 30cm with ±2cm of ultrasonic noise does not rattle the alarm, because flipping back would require retreating beyond 45cm. Try collapsing both constants to 30.0 and watch the serial log chatter — the cheapest possible demonstration of why every thermostat ever built has a dead band.',
        },
        {
          lines: 'Lines 39–41 (map + analogWrite)',
          heading: 'PWM as proportional actuation',
          body:
            'map() linearly rescales 60→5cm onto duty 0→255; analogWrite loads that into the timer compare register from Module 1. The LED brightens continuously as the gap closes — your eye integrates the 490Hz pulses. The buzzer gets the same duty but gated by alarmOn: information on two channels, urgency encoded as intensity. On a real barrier this same analogWrite would drive the MOSFET gate, and the load on the drain could be a 12V beacon — the code does not change.',
        },
        {
          lines: 'Lines 30 & 44 (timeout path + loop rate)',
          heading: 'Fail-safe defaults and sampling cadence',
          body:
            'When pulseIn times out we return −1 and the loop skips actuation, leaving the previous PWM values — a deliberate "hold last state" policy you should be able to defend (alternative: force the alarm ON when blind — fail-noisy. Which is right depends on the deployment; saying so is the M.Sc.-level answer). The 60ms delay also respects the HC-SR04\'s need for the previous burst\'s echoes to die before firing again — sample too fast and you range your own ghost.',
        },
      ],
    },

    research: {
      title: 'Predictive maintenance of the actuators themselves',
      brief:
        'Fleets die at the actuator: relay contacts pit, pump impellers wear, valves jam — usually discovered when irrigation fails on a 42°C day. Instrument the actuation edge itself: current waveforms through the MOSFET, switching counts, coil back-EMF decay — and predict failure before it happens.',
      objectives: [
        'Build a driver stage with inline current sensing (shunt + INA219) capturing inrush/steady/decay signatures per actuation',
        'Create a labelled degradation dataset by artificially ageing relays and pump motors (thousands of automated cycles)',
        'Train and deploy a lightweight anomaly detector (autoencoder or simple statistical envelope) on the MCU — edge inference, no cloud',
        'Demonstrate lead time: how many cycles before failure does the detector raise its hand, at what false-positive rate?',
      ],
      constraints: [
        'Inference must run on the MCU in <50ms per actuation event within 32KB RAM',
        'Current sampling ≥1kHz during switching windows only — the power budget must not pay for continuous sampling',
        'The system must distinguish supply brown-out signatures from genuine mechanical degradation (the confound that sinks naive versions)',
      ],
    },
  },

  // =========================================================================
  // Module 4 — Session 7
  // =========================================================================
  {
    id: 'pcb-design',
    unit: 2,
    session: 7,
    title: 'PCB Design & Prototyping',
    subtitle: 'Breadboard to manufactured board: stackups, return currents, trace physics and the KiCad workflow',
    icon: '🟩',
    minutes: 120,
    board: 'KiCad (workflow)',

    physics: {
      intro:
        'A breadboard and a manufactured PCB share a circuit but not its physics. This module covers what breadboards hide — where currents return, how copper width sets temperature, why decoupling caps exist — and the workflow from schematic to a ₹150 manufactured board.',
      concepts: [
        {
          heading: 'Why breadboards lie — parasitics and contact resistance',
          body:
            'Every breadboard joint is a spring gripping a wire: 10–100mΩ of contact resistance that shifts when you nudge the board. A 20cm jumper adds ~150nH of inductance plus an antenna. At Arduino speeds you get away with it; raise frequencies (SPI at 8MHz, a MOSFET switching in 100ns) and circuits that "worked on the breadboard" oscillate and brown-out.\n\nA PCB replaces all of it with etched copper on FR4: joints become soldered (sub-mΩ), wire lengths collapse to millimetres, and geometry becomes repeatable — board #1 and board #1,000 are electrically identical.\n\nThe prototyping ladder: breadboard to prove the concept → perfboard for a field trial → custom PCB for repeatability, compactness or volume. The jump happens earlier than students expect — at 5+ units, hand-wiring already costs more than fab + assembly.',
          diagram: {
            art: `2-layer PCB cross-section (1.6 mm standard)
  ~~~~~~~~~~~ solder mask (green insulation)
  =========== copper foil, 35 µm "1 oz"  <- signal traces
  ###########
  ####FR4#### 1.6 mm woven fibreglass + epoxy
  ###########
  =========== copper foil  <- usually one solid GND plane
  ~~~~~~~~~~~ solder mask
      |via|   plated hole connecting the two layers`,
            caption: 'Two copper layers around a fibreglass core; vias stitch them together.',
          },
        },
        {
          heading: 'Trace width is thermal engineering, and current returns under the trace',
          body:
            'A copper trace is a resistor — I²R heat must escape through the board surface. Rules of thumb for 1oz outer copper at ΔT=10°C: 0.25mm ≈ 1A, 0.5mm ≈ 2A, 1mm ≈ 3.5A. Signals stay thin; power and motor paths must be wide.\n\nCurrent flows in loops, and ground-plane return current crowds directly underneath the signal trace — that geometry minimises loop inductance. Slot the plane and the return must detour; the enlarged loop radiates EMI and picks up noise. One unbroken ground plane is the single highest-value habit in 2-layer design.\n\nDecoupling capacitors close the same story: an MCU demands a current spike in nanoseconds that the supply trace\'s inductance can\'t deliver. A 100nF cap millimetres from each VCC pin is a local reservoir — placement IS the function.',
          diagram: {
            art: `Return current hugs the trace above it:
  top:    ======== signal ========>
  plane:  <~~~ return crowds here ~~~<   (min loop area)

  Split plane = detour = antenna:
  top:    ======== signal ========>
  plane:  ____| GAP |____ <- return forced around: EMI`,
            caption: 'Keep the plane solid: the loop area between signal and return sets the noise.',
          },
        },
        {
          heading: 'The KiCad workflow — schematic, footprints, layout, DRC',
          body:
            'Schematic capture: place symbols, wire nets, name them — defines connectivity (the netlist) with zero geometry. The Electrical Rules Check catches "two outputs shorted" and "input never driven" — your Virtual Lab validator was a baby ERC.\n\nFootprint assignment binds each symbol to a physical land pattern — the same capacitor can be a hand-solderable 0805 or a rice-grain 0402. Choose what you can assemble.\n\nLayout places components, then routes traces. The Design Rules Check enforces the fab\'s physics — trace width, clearance, via annular rings. DRC-clean means manufacturable, not correct — correctness was decided at the schematic.',
          diagram: {
            art: `Schematic --ERC--> Footprints --> Layout --DRC--> Gerbers
  (symbols,   (catches      (assign       (route +    (files
   nets)      shorts /       packages)     place      sent to
              unconnected)                 copper)     the fab)`,
            caption: 'Four stage-gates: each one catches a different class of mistake.',
          },
        },
        {
          heading: 'Design for manufacturability — and getting boards made from India',
          body:
            'Fabs publish capabilities: a standard process is 6mil (0.15mm) trace/space, 0.3mm minimum drill, 1.6mm FR4. Design at those limits and boards cost almost nothing; demand 3mil traces and the price multiplies. DFM means staying inside that cheap envelope.\n\nFrom Bengaluru: export Gerbers + drill file, upload to JLCPCB/PCBWay — five 2-layer 50×50mm boards for $2–4, 7–12 days. Indian fabs (PCB Power, Lion Circuits) cost more but deliver in 3–5 days, no customs.\n\nThe professional loop: order rev A, find the mistakes (there always are), fix, order rev B. Budget two spins into every project, and silkscreen the revision onto the board.',
          diagram: {
            art: `Cheap envelope (standard process):
  trace/space >= 6 mil (0.15 mm)
  drill       >= 0.3 mm
  board        1.6 mm FR4

Pipeline: Gerbers + drill file -> JLCPCB / PCBWay /
  Lion Circuits -> 5 boards, $2-4, 7-12 days
  rev A -> find mistakes -> fix -> rev B`,
            caption: 'Stay inside the cheap envelope and a 2-layer board costs almost nothing.',
          },
        },
      ],
    },

    wiring: {
      intro:
        'No jumper wires this time — the "wiring" is the KiCad pipeline applied to a board you already understand: the Session 4 weather node (ESP32 + DHT11 + LDR), going from bench circuit to fab-ready files.',
      diagram: {
        art: `Target layout (50 x 50 mm, 2-layer)
 +----------------------------------+
 | [DHT11 hdr]          [LDR hdr]    |
 |                                   |
 |        +-----------------+       |
 |        |  ESP32 DevKit   |        |
 |        |   (socket)      |        |
 |        +-----------------+        |
 |  [100nF][10uF]  near 3V3 pins     |
 |                                   |
 | bottom layer: one solid GND plane |
 +----------------------------------+`,
        caption: 'Sensors at the edges, decoupling caps tight to the ESP32, solid ground plane below.',
      },
      steps: [
        { from: 'Virtual Lab bench', to: 'KiCad schematic', purpose: 'Re-draw the proven circuit as symbols and nets: ESP32 module, DHT11 header, LDR divider (now with its explicit 10kΩ resistor), 100nF + 10µF decoupling on 3V3.' },
        { from: 'Schematic', to: 'ERC pass', purpose: 'Run the Electrical Rules Check; annotate every net (3V3, GND, DHT_DATA, LDR_ADC). Unnamed nets become unfindable bugs at layout.' },
        { from: 'Symbols', to: 'Footprints', purpose: 'Bind hand-solderable packages: 0805 passives, 2.54mm pin headers for the sensors, the ESP32 as a DevKit socket (two 1×15 female headers) — the module stays replaceable.' },
        { from: 'Placement', to: 'Layout', purpose: 'Sensors\' headers at the board edge, decouplers within 3mm of the ESP32 power pins, LDR divider away from the hot voltage regulator (a thermistor by accident otherwise).' },
        { from: 'Routing', to: 'GND plane', purpose: 'Route signals on top; flood the bottom layer as one unbroken ground plane. Power traces at 0.5mm; signals at 0.25mm.' },
        { from: 'DRC pass', to: 'Gerbers + drill file', purpose: 'Design Rules Check against the JLCPCB 6mil profile, then export. The Gerber viewer is your last proofread — fabs build exactly what the files say, typos included.' },
      ],
      labNote:
        'Before KiCad, re-open your weather-station bench in the Virtual Lab and list every wire — that list IS your netlist. The assignment: bring a DRC-clean layout and a screenshot of the fab\'s quoted price for 5 boards.',
    },

    code: {
      language: 'python',
      listing: `# Session 7 — IPC-2221 trace width calculator (the math your fab
# assumes you did). Run with: python3 trace_width.py
import math

# IPC-2221 constants: I = k * dT^0.44 * A^0.725, A in mil^2
K_EXTERNAL = 0.048   # outer layers (air-cooled)
K_INTERNAL = 0.024   # inner layers (laminated: half the cooling)
OZ_TO_MIL  = 1.378   # 1 oz/ft^2 copper foil is 1.378 mil thick

def min_width_mm(current_a: float, temp_rise_c: float = 10.0,
                 copper_oz: float = 1.0, external: bool = True) -> float:
    """Minimum trace width (mm) for a current and allowed heating."""
    k = K_EXTERNAL if external else K_INTERNAL
    # invert the IPC formula for cross-section area (sq. mil)
    area_mil2 = (current_a / (k * temp_rise_c ** 0.44)) ** (1 / 0.725)
    width_mil = area_mil2 / (copper_oz * OZ_TO_MIL)
    return width_mil * 0.0254          # mil -> mm

if __name__ == "__main__":
    print(f"{'amps':>5} | {'outer 1oz':>9} | {'inner 1oz':>9}")
    print("-" * 31)
    for amps in (0.1, 0.5, 1.0, 2.0, 3.0, 5.0):
        outer = min_width_mm(amps)
        inner = min_width_mm(amps, external=False)
        print(f"{amps:>5.1f} | {outer:>7.2f}mm | {inner:>7.2f}mm")

    # Sanity-check a design decision from the lecture:
    w = min_width_mm(2.0, temp_rise_c=10)
    print(f"\\nMotor rail at 2 A needs >= {w:.2f} mm on outer copper.")`,
      walkthrough: [
        {
          lines: 'Lines 5–8 (constants)',
          heading: 'Where the magic numbers come from',
          body:
            'IPC-2221 fitted I = k·ΔT^0.44·A^0.725 to decades of measured boards. k encodes cooling: outer traces touch air (0.048); inner traces are sealed in fibreglass and get half the constant — the same current needs roughly double the copper inside. The 1.378 mil thickness is what "1oz copper" means: one ounce of copper rolled flat over one square foot.',
        },
        {
          lines: 'Lines 13–17 (the inversion)',
          heading: 'Solving the design problem, not the analysis problem',
          body:
            'The standard answers "given a trace, how hot?" — but the designer needs "given a current, how wide?", so we invert: A = (I / (k·ΔT^0.44))^(1/0.725), then width = area ÷ thickness. Note what the exponents imply: doubling allowed temperature rise does NOT halve the width (0.44 root), and width grows faster than linearly with current (1/0.725 ≈ 1.38 power) — high-current paths get expensive quickly, which is why real boards use copper pours, not fat traces.',
        },
        {
          lines: 'Lines 20–26 (the table)',
          heading: 'Reading your own output like an engineer',
          body:
            'The printed table should match the lecture rules of thumb (≈0.25mm at 1A outer, ≈0.5–0.6mm at 2A). When a formula, a chart and a rule of thumb agree, you can defend the design in review; when they disagree, you have found either a unit error or an interesting question — both worth chasing. Try ΔT=20°C and watch every width shrink by ~27% — a deliberate trade of temperature for routing space.',
        },
        {
          lines: 'Whole file',
          heading: 'Why this is "hardware code"',
          body:
            'No pin ever toggles here, yet this is embedded engineering: the calculation happens before layout, and its output is frozen into copper geometry that cannot be patched with a firmware update. PCB mistakes cost a fab cycle (a week, a few hundred rupees); this 30-line script is the cheapest insurance in the whole course. The same inversion pattern applies to via current ratings and connector derating — the exercise asks you to extend it to vias.',
        },
      ],
    },

    research: {
      title: 'An open, India-manufacturable carrier board for agricultural sensor nodes',
      brief:
        'Commercial ESP32 sensor carriers are designed around Shenzhen logistics. Design, fabricate and validate an open-hardware 2-layer carrier optimised for Indian smallholder deployments — local fab capabilities, monsoon-proof connectors, field-replaceable sensors — and publish it as a reproducible research artefact.',
      objectives: [
        'Design a 2-layer KiCad carrier: ESP32 module socket, screw-terminal sensor headers, MOSFET actuation channel with flyback protection, solar/LiFePO4 charge path',
        'Apply and document every DFM rule for two Indian fabs and one Chinese fab; compare yield, cost and lead time across a 10-board run of each',
        'Validate electrically: measure deep-sleep leakage of the bare board (<10µA target), 2A actuation-channel temperature rise vs your IPC calculations',
        'Release as certified open hardware (OSHWA) with a reproduction protocol — the publishable contribution is the validated design + data, not the gadget',
      ],
      constraints: [
        'Strict 2-layer, 6mil/0.3mm standard process — the point is the cheap envelope, not exotic fabrication',
        'Every component hand-solderable (0805/SOIC minimum) so a college lab can assemble it',
        'Unit cost under ₹400 at quantity 50, bill of materials fully sourceable from Indian distributors',
      ],
    },
  },
]

export function getModule(id: string): LectureModule | undefined {
  return UNIT2_MODULES.find((m) => m.id === id)
}
