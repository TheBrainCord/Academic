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
        'Before writing a single line of code, you must be able to picture what the silicon is doing. This module opens the chip: what separates a ₹250 microcontroller from a ₹5,000 microprocessor, what physically sits behind every GPIO pin, how an ADC turns a voltage into a number, and how three wires can carry a conversation between chips.',
      concepts: [
        {
          heading: 'MCU vs MPU — one die versus a computer on a board',
          body:
            'A microcontroller (MCU) like the ESP32 or the ATmega328P on the Arduino Uno is a complete computer on one die: CPU core, flash (program memory), SRAM (data memory), and every peripheral — timers, ADC, UART — share that single piece of silicon. There is no operating system between your code and the hardware; when you write to a register, the voltage on a pin changes in nanoseconds. Power consumption is microamps to milliamps, and the chip boots in milliseconds.\n\nA microprocessor (MPU) like the BCM2711 in the Raspberry Pi 4 is only a CPU (plus caches and an MMU). RAM is a separate chip, storage is an SD card, and you need a full OS — Linux — to make it useful. You gain gigahertz, gigabytes and a filesystem; you lose determinism (Linux may pre-empt your pin-toggling code for 10ms whenever it likes), instant boot, and the microamp power budget.\n\nThe selection rule for IoT: if the job is "read sensors, decide, transmit, sleep", an MCU wins. If the job needs vision, a database, or heavy maths — a Jetson Nano running a neural network, a Pi serving dashboards — you need an MPU. Most serious products use both: MCU at the sensing edge, MPU as the gateway.',
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
            'Every GPIO pin hides a small circuit. The output stage is a CMOS push-pull pair: a PMOS transistor to the supply rail and an NMOS transistor to ground. Drive the pair one way and the PMOS conducts — the pin is "HIGH", sourcing current from VCC. Drive it the other way and the NMOS conducts — "LOW", sinking current to ground. Each transistor has finite on-resistance, which is why a pin can only source/sink ~12–40mA before it overheats — and why shorting an output pin to a rail kills it.\n\nThe input stage is a Schmitt trigger — a comparator with two thresholds. On 3.3V logic, the input must rise above ~2.0V to register HIGH and fall below ~0.8V to register LOW; the gap (hysteresis) stops a slowly drifting or noisy voltage from rattling the input between states. An unconnected input floats between the thresholds and reads random values — this is the "floating pin" you met in the Virtual Lab, and it is why internal pull-up resistors (a ~45kΩ resistor to VCC, enabled by a register bit) exist.\n\nThree registers control all of it (AVR names; every MCU has equivalents): DDR decides direction (output driver enabled or not), PORT sets the output level — or, in input mode, enables the pull-up — and PIN reads the Schmitt trigger output. pinMode() and digitalWrite() are nothing more than single-bit writes into these registers.',
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
            'An ADC (analog-to-digital converter) measures a voltage by binary search. The dominant design in MCUs is the SAR — successive approximation register. A sample-and-hold capacitor freezes the input voltage; the SAR then asks one question per bit: "is the input above half the reference?" — sets that bit accordingly, then compares against quarter steps, eighth steps, and so on. A 10-bit conversion (Uno: 0–1023) takes 10 comparisons; a 12-bit one (ESP32: 0–4095) takes 12. Resolution in volts = Vref / 2^bits: the Uno resolves 5V/1024 ≈ 4.9mV per count.\n\nDACs do the reverse, but most MCUs fake analog output with PWM — pulse width modulation. A hardware timer counts up repeatedly; a compare register flips the pin HIGH for the first N counts of every cycle. The ratio N/total is the duty cycle. Switch fast enough (490Hz on the Uno, up to 40MHz on the ESP32) and anything slow — an LED into your eye, a motor\'s inertia, an RC filter — averages the pulses into an effective voltage of duty × VCC.\n\nThe Raspberry Pi\'s famous catch belongs here: the BCM2711 has no on-chip ADC at all. Analog sensors need an external SAR chip (the MCP3008) connected over SPI — a 10-bit ADC the Pi interrogates digitally.',
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
            'UART is the oldest: two wires (TX→RX each way), no clock. Both sides agree on a baud rate in advance; each byte travels framed by a start bit and stop bit, and the receiver samples mid-bit using its own clock. Simple, but only ever point-to-point, and a 2% clock mismatch corrupts data.\n\nI2C runs a whole network on two wires: SDA (data) and SCL (clock), both open-drain — devices can only pull the line LOW; a shared pull-up resistor restores HIGH. This is why nothing burns when two devices "talk at once" (wired-AND), and it enables addressing: the master broadcasts a 7-bit address, and only the matching slave ACKs by pulling SDA low during the 9th clock. Typical speed 100–400kHz; dozens of sensors share one bus. On the Uno, A4/A5 are the I2C pins; on the Pi, GPIO2/GPIO3.\n\nSPI trades wires for speed: dedicated MOSI, MISO and SCK lines plus one chip-select wire per device. The master clocks bits out on MOSI and simultaneously clocks bits in on MISO — full duplex, no addressing overhead, tens of MHz. Displays, SD cards and the MCP3008 ADC all speak SPI. Rule of thumb: UART for one neighbour, I2C for many slow sensors, SPI for few fast ones.',
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
            'A battery-powered IoT node lives or dies by its energy budget, not its clock speed. An ESP32 with Wi-Fi transmitting draws ~160–260mA; CPU running quietly, ~40mA; light sleep ~0.8mA; deep sleep — RAM mostly off, a real-time clock ticking — ~10µA. A 2,000mAh battery lasts 8 hours transmitting continuously, but years if the node sleeps and wakes for two seconds every ten minutes.\n\nThe arithmetic every designer does: average current = (t_active × I_active + t_sleep × I_sleep) / (t_active + t_sleep). For 2s at 100mA every 600s, plus deep sleep at 10µA: average ≈ (2×100,000 + 598×10) / 600 ≈ 343µA → roughly 8 months on 2,000mAh. Every extra awake-second is the enemy; this is why protocol choice, sensor warm-up time and even how fast your code runs are power decisions.\n\nIndia context worth quoting in class: Bolt IoT (Bengaluru) builds Wi-Fi MCU platforms for exactly this duty-cycle pattern, and C-DAC\'s SHAKTI program is producing indigenous RISC-V processors — the long-term answer to importing every microcontroller this country deploys.',
        },
      ],
    },

    wiring: {
      intro:
        'We rebuild Session 4\'s assignment circuit: an ESP32 reading a DHT11 (temperature + humidity, digital one-wire) and an LDR (light, analog) — the exact pattern of the Nashik vineyard nodes. Wire it in the Virtual Lab first; the same connections work on Wokwi with a DHT22.',
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
        'A sensor is a transducer: it converts a physical quantity into an electrical one. Everything downstream — your ADC counts, your dashboards, your ML models — inherits the physics of that conversion. This module builds the vocabulary to read a datasheet critically and the math to turn raw counts into numbers you can defend in a paper.',
      concepts: [
        {
          heading: 'Transduction — how physics becomes voltage',
          body:
            'Resistive sensors change resistance with the measured quantity: an LDR\'s cadmium-sulphide film frees more charge carriers under photons (resistance falls with light); a thermistor\'s semiconductor frees carriers with heat; a soil probe conducts better through wet soil\'s dissolved ions. Resistance is not voltage, so we wrap the element in a voltage divider: Vout = VCC × R2/(R1+R2). The MCU\'s ADC reads Vout — which is why your LDR module has three pins, not two.\n\nCapacitive sensors change capacitance: the DHT11\'s humidity element is a polymer dielectric between electrodes that absorbs water vapour, shifting its permittivity. The chip measures the capacitor\'s charge time against an internal oscillator. Capacitive soil probes work identically and outlive resistive ones because no metal touches the electrolyte — no corrosion.\n\nPiezoelectric sensors generate charge under mechanical stress (the HC-SR04\'s transducers are piezo discs: drive them with 40kHz to emit ultrasound, and the returning echo strains the receiving disc into producing a measurable voltage). Photodiodes in PIR sensors, Hall elements for current, thermopiles for IR — every sensor family is one of a handful of physical effects wearing different packaging.',
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
          heading: 'Accuracy vs precision vs resolution vs range — four different promises',
          body:
            'Accuracy is closeness to the truth: a DHT11 promises ±2°C — your 25.0°C reading means "somewhere between 23 and 27". Precision (repeatability) is the spread between repeated measurements of the same value: a sensor can be beautifully precise and consistently wrong (a 1.5°C offset, say) — that combination is fixable by calibration; imprecision is not.\n\nResolution is the smallest step the system can represent. It is set by the weakest link: the DHT11 reports whole degrees (sensor-limited); a 10-bit ADC on a 5V reference cannot see changes below ~4.9mV (converter-limited). More ADC bits never add accuracy — a 16-bit reading of a ±2°C sensor is four extra bits of confidently stated noise.\n\nRange is where the promises hold: the DHT11 measures 0–50°C; at 55°C it doesn\'t fail loudly, it just lies. Datasheet exercise from this session: the DHT22 (±0.5°C, 0.1° resolution, −40 to 80°C, one read per 2s) against the BME280 (±1°C but ±3% RH, 0.01° resolution, I2C, ~µA sleep current) — for a Bengaluru weather station the BME280\'s speed, bus interface and power win; the decision is an engineering argument, not a spec-sheet beauty contest.',
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
            'Noise is random variation between consecutive samples — thermal agitation in resistors, supply ripple, electromagnetic pickup on your wires. Because it is random with mean zero, averaging N samples shrinks its standard deviation by √N: average 16 readings and noise drops fourfold. That is the cheapest signal-processing win in embedded systems and costs only time.\n\nDrift is slow, systematic change in the sensor itself: electrolytic corrosion on soil-probe electrodes, dust on an LDR, polymer ageing in humidity elements. Averaging cannot remove a bias that moves with time — only recalibration can, which is why the syllabus says your soil sensor needs annual recalibration.\n\nTwo-point calibration is the workhorse: measure the raw reading in two known conditions — soil probe in air (raw_dry, true 0%) and in water (raw_wet, true 100%) — then map linearly: value = (raw − raw_dry) × 100 / (raw_wet − raw_dry). You are solving y = mx + c from two anchor points; it corrects both offset and scale error in one shot. Three or more points reveal non-linearity, which you fit with a curve or a lookup table.',
        },
        {
          heading: 'Sensor fusion — why Apollo\'s wards alarm 60% less',
          body:
            'Every sensor lies differently. A GPS gives absolute position but wanders metre-scale and dies indoors; an accelerometer integrates beautifully over 100ms but its tiny bias, double-integrated, drifts metres within a minute; a barometer nails relative altitude but wanders with the weather. Fusion exploits complementary error structures: trust the accelerometer at high frequency, the GPS/barometer at low frequency.\n\nThe simplest fusion is the complementary filter: estimate = α × (fast sensor) + (1−α) × (slow sensor), with α ≈ 0.98 for gyro+accelerometer attitude estimation. The Kalman filter generalises this, weighting each source by its variance every time step — statistically optimal when errors are Gaussian.\n\nThe Apollo Hospitals case is fusion as logic: an SpO2 dip alone might be a loose finger clip; an SpO2 dip while the ECG shows tachycardia and the accelerometer shows the patient is motionless is an emergency. Demanding agreement between independent sensors before alarming cut false alarms ~60% — directly transferable to any IoT alerting system you will ever build.',
        },
      ],
    },

    wiring: {
      intro:
        'The bench experiment: one clean analog source (potentiometer — you control the truth by turning the knob) and one messy real sensor (LDR) on the Uno\'s 10-bit ADC. The pot teaches the ADC transfer function; the LDR gets the calibration treatment.',
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
        'Sensing is half of IoT; the value is in acting — switching a pump, dimming a streetlight, dispensing a drug. But actuators are power components and your GPIO pin can deliver ~20mA at 5V. This module is about the physics of switching real loads without destroying the controller doing the switching.',
      concepts: [
        {
          heading: 'The current chasm — why a pin cannot drive a motor',
          body:
            'A GPIO output is that small CMOS pair from Module 1: its transistors have on-resistance of tens of ohms and a thermal limit near 20–40mA. A relay coil wants 70mA, a small DC motor 200–1,000mA (and several amps at stall), a pump more. Connect any of these directly and the pin\'s transistor becomes the fuse.\n\nThe universal pattern is staged amplification: the pin switches a transistor, the transistor switches the load, and a separate power rail carries the load current. The pin\'s job shrinks to charging a transistor\'s input — microamps to milliamps — while the load draws its amps from a supply built for it.\n\nThis also isolates voltage domains: a 3.3V ESP32 pin can switch a 12V motor or, through a relay, 230V mains — provided the stages are designed for it. Every driver circuit you will ever meet (motor driver ICs, relay boards, LED strip drivers) is this one idea in packaging.',
        },
        {
          heading: 'The MOSFET as a switch — gate charge, Rds(on) and "logic-level"',
          body:
            'A MOSFET is a voltage-controlled switch: the gate is an insulated capacitor; charging it above the threshold voltage forms a conductive channel between drain and source. No steady gate current flows — the pin only supplies a pulse of charge at each switching edge — which is why MOSFETs, not bipolar transistors, dominate modern drivers.\n\nThe key datasheet number is Rds(on), the channel resistance when fully on: a logic-level FET like the IRLZ44N reaches ~0.025Ω with just 5V on the gate. At 2A load that dissipates I²R = 0.1W — barely warm, no heatsink. The classic student trap is the IRF540 (not logic-level): at 5V gate drive it is only half-on, Rds(on) is tens of times higher, and it cooks. "Logic-level" is the phrase that means "fully enhances at 3.3–5V".\n\nIn the standard low-side configuration the FET sits between load and ground, with a 10kΩ resistor from gate to ground so the load stays off while the MCU boots (a floating gate — Module 1\'s floating pin, with amps behind it). PWM into the gate gives proportional control: motor speed, LED-strip brightness, heater power.',
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
            'Coils — relay coils, motor windings, solenoids — store energy in a magnetic field: E = ½LI². An inductor\'s defining law, V = L·di/dt, has a vicious corollary: interrupt the current instantly and di/dt → huge, so the coil generates whatever voltage it takes to keep its current flowing. Switch off a relay coil with a bare transistor and the coil end swings to hundreds of volts negative spike — through your switching device.\n\nThe flyback diode is the escape route: placed across the coil, reverse-biased in normal operation (invisible), it becomes forward-biased the instant the switch opens, letting the coil\'s current recirculate harmlessly through the loop and decay in the winding resistance. One ₹2 component versus one dead MOSFET — or a dead microcontroller, since the spike happily couples back through the gate.\n\nRelays themselves add a second isolation trick: the coil and the contacts are mechanically linked but electrically separate, so an MCU-side 5V coil can switch 230V mains with no shared wire. For mains work, professional designs add an optocoupler before the transistor too — an LED shining at a phototransistor across a plastic gap — so even a catastrophic failure on the load side cannot reach the logic. (E-ink displays sit at the opposite extreme of "real output": charged pigment particles electrophoretically parked by a field — zero power to hold an image, which is why shelf labels last years on a coin cell.)',
        },
        {
          heading: 'Closing the loop — hysteresis or the system chatters',
          body:
            'A complete IoT loop is sense → decide → act → (the action changes what you sense). The naive decision rule "pump ON if moisture < 40%" fails in practice: at the threshold, noise of ±1% switches the pump on and off several times a minute — chattering — which mechanically destroys relays (rated ~100k cycles) and pumps.\n\nThe fix is the same hysteresis you met inside the Schmitt trigger, now applied in software: turn ON below 35%, OFF above 45%. Inside the 10-point dead band the actuator holds its previous state, so one decision requires the signal to travel the full gap. Width is an engineering choice: wider = fewer cycles but sloppier regulation.\n\nAdd time-based guards in real deployments — minimum on-time, minimum off-time, a daily cycle budget — because sensors fail, and an actuator wired to a failed sensor must fail safe. The parking-sensor circuit you will wire next is the smallest honest version of this loop: distance in, sound out, hysteresis in the middle.',
        },
      ],
    },

    wiring: {
      intro:
        'The Smart-City parking assistant: an HC-SR04 measures distance, the Uno decides, a buzzer and LED act. Sensor → decision → actuator on one bench. (The buzzer stands in for the MOSFET-driven loads of the lecture — its current is pin-safe; the decision logic is identical.)',
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
        'Your Virtual Lab bench and a breadboard share a secret: they are held together by hope and spring contacts. Products ship on printed circuit boards. This module covers the physics that breadboards hide — where currents actually return, how copper width sets temperature, why decoupling capacitors exist — and the workflow that turns a schematic into a ₹150 manufactured board from a fab.',
      concepts: [
        {
          heading: 'Why breadboards lie — parasitics and contact resistance',
          body:
            'Every breadboard joint is a phosphor-bronze spring gripping a wire: 10–100mΩ of contact resistance that changes when you nudge the board. Adjacent 5-hole rails form ~2pF capacitors with each other, and a 20cm jumper wire is ~150nH of inductance plus an antenna. At Arduino speeds you get away with it; raise frequencies (SPI at 8MHz, a MOSFET switching amps in 100ns) and circuits that "worked on the breadboard" oscillate, glitch and brown-out.\n\nA PCB replaces all of it with photolithographically etched copper foil laminated onto FR4 fibreglass: joints become soldered (sub-mΩ, gas-tight), wire lengths collapse to millimetres, and — the real prize — geometry becomes repeatable. Board #1 and board #1,000 are electrically identical, which is what "productising" physically means.\n\nThe prototyping ladder: breadboard to prove the concept, perfboard (soldered, hand-wired) when it must survive a field trial, custom PCB when you need repeatability, compactness, EMC compliance or more than a handful of units. The jump to PCB happens earlier than students expect — at 5+ units, hand-wiring time already costs more than fab + assembly.',
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
            'A copper trace is a resistor: 35µm foil at 0.25mm width gives ~0.5mΩ per millimetre. Push current through and I²R heat must escape through the board surface; the IPC-2152 charts answer "what width for what current at what temperature rise". Rules of thumb for 1oz outer copper at ΔT=10°C: 0.25mm ≈ 1A, 0.5mm ≈ 2A, 1mm ≈ 3.5A. Signals can stay thin; power and motor paths must be wide — or made of polygon pours.\n\nThe least intuitive fact in PCB design: current always flows in loops, and the return current in your ground plane does not take the shortest path — it crowds directly underneath the signal trace, because that geometry minimises the loop\'s inductance. Slot the ground plane (or route a trace across a split) and the return current must detour; the enlarged loop becomes both a transmitting antenna (EMI you radiate) and a receiving one (noise you swallow). One unbroken ground plane on layer 2 is the single highest-value habit in 2-layer design.\n\nDecoupling capacitors close the same story: when an MCU\'s thousands of transistors switch on a clock edge, it demands a current spike in nanoseconds. The supply trace\'s inductance cannot deliver it (V = L·di/dt again — the rail would sag). A 100nF ceramic capacitor placed millimetres from each VCC pin is a local charge reservoir feeding the spike from next door. Placement IS the function: the same capacitor 3cm away is behind too much inductance to help.',
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
            'KiCad (free, open-source, used professionally) formalises design into stages. Schematic capture: place symbols, wire nets, name them — this defines connectivity, the netlist, with zero geometry. The Electrical Rules Check catches "two outputs shorted" and "input never driven" — your Virtual Lab validator was a baby ERC.\n\nFootprint assignment binds each symbol to a physical land pattern: the same 100nF capacitor can be a hand-solderable 0805 (2mm) or a rice-grain 0402. Choose footprints you can actually assemble — 0805 and SOIC for hand-soldering; finer pitches mean a stencil and hot air.\n\nLayout: place components (connectors at edges, decouplers touching their pins, crystal beside the MCU), then route traces. The Design Rules Check enforces the fab\'s physics — minimum trace width, clearance between copper, annular ring on vias, thermal reliefs (spoke-shaped pad connections so a soldering iron can heat a pad that would otherwise dump heat into the plane). DRC-clean means manufacturable, not correct — correctness died or survived back at the schematic.',
        },
        {
          heading: 'Design for manufacturability — and getting boards made from India',
          body:
            'Fabs publish capabilities: a standard process is 6mil (0.15mm) trace/space, 0.3mm minimum drill, 1.6mm FR4. Design at the standard limits and boards cost almost nothing; demand 3mil traces or blind vias and the price multiplies. DFM is the discipline of staying inside the cheap envelope: respect clearances with margin, prefer one drill size, keep copper balanced across layers so the board doesn\'t warp in reflow.\n\nThe ordering pipeline from Bengaluru: export Gerbers (one file per copper/mask/silk layer) plus the drill file, upload to JLCPCB or PCBWay — five 2-layer 50×50mm boards for $2–4 plus shipping, 7–12 days to your hostel. Indian fabs (PCB Power, Lion Circuits) cost more per board but deliver in 3–5 days with no customs lottery — the lead-time/cost trade-off is itself a supply-chain lesson.\n\nThe professional loop is: order rev A, find the mistakes (there are always mistakes — a swapped RX/TX, a connector mirrored), fix, order rev B. Budget two spins into every project plan, and silkscreen the revision and date onto the board — future-you will be grateful.',
        },
      ],
    },

    wiring: {
      intro:
        'No jumper wires this time — the "wiring" is the KiCad pipeline applied to a board you already understand: the Session 4 weather node (ESP32 + DHT11 + LDR), going from bench circuit to fab-ready files. Each step below is one stage gate.',
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
