import type { TeachingDeck } from '@/types/teaching-decks'

const commonPreparation = [
  'Pre-install the ESP32 board package and PubSubClient library in Arduino IDE.',
  'Write the classroom Wi-Fi name and password on a private teacher card, not on the projected slide.',
  'Prepare one known-good ESP32 circuit and test the broker connection before class.',
  'Give every team a unique topic prefix such as mcsa341b/team01 to avoid message collisions.',
]

export const UNIT4_DECKS: TeachingDeck[] = [
  {
    id: 'unit4-cloud-data-pipeline',
    unit: 4,
    session: 12,
    title: 'From ESP32 Reading to Cloud Decision',
    subtitle: 'Cloud architecture, MQTT ingestion, time-series storage and a complete 60-minute classroom build',
    icon: '☁️',
    minutes: 60,
    essentialQuestion: 'What must happen after a sensor produces a reading before that reading becomes useful?',
    objectives: [
      'Trace one reading through device, broker, processing, storage and dashboard stages',
      'Explain why time-series data needs a timestamp, device identity and unit',
      'Publish ESP32 telemetry and control an LED through MQTT topics',
      'Choose hot, warm or cold storage for a stated IoT need',
    ],
    equipment: ['ESP32 DevKit', 'Built-in LED or LED + 220 Ω resistor', 'Wi-Fi hotspot', 'Arduino IDE', 'MQTT client'],
    preparation: commonPreparation,
    slides: [
      {
        id: 'cloud-hook',
        kind: 'hook',
        label: 'Predict',
        title: 'A temperature number just left the ESP32. Where does it go?',
        subtitle: 'Begin with the destination, then uncover the system between the sensor and the decision.',
        durationMinutes: 5,
        teacherPrompt: 'Show “31.7” alone. Ask: Can we trust it? Can we act on it? What information is missing?',
        studentOutcome: 'Students identify at least device identity, timestamp and unit as necessary context.',
        cards: [
          { title: '31.7', kicker: 'Raw value', body: 'No device, time or unit. It cannot yet support a defensible decision.', accent: 'red' },
          { title: 'room-04', kicker: 'Source', body: 'Device identity tells the platform which classroom produced the reading.', accent: 'blue' },
          { title: '2026-09-05T10:15:00Z', kicker: 'Time', body: 'A timestamp turns isolated readings into a sequence that can be queried.', accent: 'gold' },
          { title: '°C', kicker: 'Meaning', body: 'A unit prevents software and people from interpreting the value incorrectly.', accent: 'green' },
        ],
        poll: {
          question: 'Which payload is ready to store?',
          options: [
            { label: '31.7', feedback: 'Not yet. The value has no source, timestamp or unit.' },
            { label: 'room-04, 31.7 °C, 10:15', feedback: 'Correct. This measurement has identity, value, unit and time.', correct: true },
            { label: 'Temperature is high', feedback: 'That is an interpretation, not the original measurement evidence.' },
          ],
        },
      },
      {
        id: 'cloud-plan',
        kind: 'plan',
        label: '60-minute route',
        title: 'Today’s teaching and build sequence',
        durationMinutes: 3,
        teacherPrompt: 'Assign roles now: wiring lead, firmware lead and evidence reporter. Tell teams exactly what must be demonstrated at minute 52.',
        studentOutcome: 'Every team knows its role, output and time limit.',
        timeline: [
          { minutes: '0–5', title: 'Question the reading', teacherAction: 'Expose missing context.', studentEvidence: 'Name the four fields a reading needs.' },
          { minutes: '5–8', title: 'Set roles and evidence', teacherAction: 'Assign wiring, firmware and reporting roles.', studentEvidence: 'Repeat the team success condition.' },
          { minutes: '8–18', title: 'Walk the pipeline', teacherAction: 'Reveal one stage at a time.', studentEvidence: 'Trace a packet end to end.' },
          { minutes: '18–26', title: 'Choose storage', teacherAction: 'Present three retrieval needs.', studentEvidence: 'Defend hot, warm or cold.' },
          { minutes: '26–46', title: 'ESP32 MQTT build', teacherAction: 'Coach by symptoms, not by rewiring teams.', studentEvidence: 'Publish telemetry and receive an LED command.' },
          { minutes: '46–55', title: 'Explain the code', teacherAction: 'Connect functions to pipeline stages.', studentEvidence: 'Annotate publish, subscribe and loop.' },
          { minutes: '55–58', title: 'Check understanding', teacherAction: 'Run the class vote.', studentEvidence: 'Separate broker, storage and dashboard roles.' },
          { minutes: '58–60', title: 'Exit ticket', teacherAction: 'Collect one-minute papers.', studentEvidence: 'Answer the essential question.' },
        ],
      },
      {
        id: 'cloud-pipeline',
        kind: 'concept',
        label: 'Tap the pipeline',
        title: 'One reading, five responsibilities',
        subtitle: 'Tap each stage and make students predict the next transformation before revealing it.',
        durationMinutes: 10,
        teacherPrompt: 'At each stage ask: What enters? What leaves? What fails here? Use the same temperature packet throughout.',
        studentOutcome: 'Students can reconstruct the ingestion pipeline without looking at the slide.',
        flow: [
          { label: '1 · ESP32', detail: 'Samples the sensor, validates the reading and creates a payload.', packet: '{device:"room-04", temp:31.7, unit:"C", ts:...}' },
          { label: '2 · MQTT broker', detail: 'Receives the publication and forwards it to every authorized subscriber.', packet: 'topic: college/room-04/temperature' },
          { label: '3 · Stream rule', detail: 'Rejects invalid values, adds context and detects threshold events.', packet: 'if temp > 40 → alert event' },
          { label: '4 · Time-series DB', detail: 'Indexes measurements primarily by time, device and field for efficient range queries.', packet: 'room-04 · temp · 31.7 · timestamp' },
          { label: '5 · Dashboard', detail: 'Turns stored evidence into trends, status and decisions without changing the original record.', packet: 'chart + latest value + alert state' },
        ],
        cards: [
          { title: 'Failure question', body: 'If the dashboard is closed, should ingestion stop? No—the pipeline must keep storing data independently.', accent: 'red' },
          { title: 'Design rule', body: 'Store facts first. Compute changing interpretations, such as “too hot,” with versioned rules.', accent: 'green' },
        ],
      },
      {
        id: 'cloud-storage',
        kind: 'compare',
        label: 'Make a choice',
        title: 'Hot, warm or cold: storage follows the question',
        durationMinutes: 8,
        teacherPrompt: 'Read each need aloud. Students point to a storage tier, then reveal the rationale by tapping its card.',
        studentOutcome: 'Students justify storage by access speed, age and cost rather than memorising product names.',
        cards: [
          { title: 'Hot', kicker: 'Seconds to days', body: 'Fast operational queries: latest readings, live alarms and today’s dashboard. Highest cost per stored byte.', accent: 'red' },
          { title: 'Warm', kicker: 'Weeks to months', body: 'Recent history used for reports, comparison and model features. Moderate speed and cost.', accent: 'gold' },
          { title: 'Cold', kicker: 'Months to years', body: 'Compressed archives for audits, retraining and rare investigations. Slow retrieval, lowest routine cost.', accent: 'blue' },
        ],
        poll: {
          question: 'A safety dashboard needs the last five minutes of readings. Which tier?',
          options: [
            { label: 'Hot', feedback: 'Correct. Operators need immediate access to the latest evidence.', correct: true },
            { label: 'Warm', feedback: 'Useful for recent reports, but not the best home for live safety status.' },
            { label: 'Cold', feedback: 'Cold archives trade retrieval speed for lower long-term cost.' },
          ],
        },
      },
      {
        id: 'cloud-mqtt-build',
        kind: 'activity',
        label: '20-minute build',
        title: 'ESP32 MQTT telemetry + remote LED',
        subtitle: 'One board demonstrates both directions of an IoT data service.',
        durationMinutes: 20,
        teacherPrompt: 'First prove publish, then prove subscribe. Do not let teams debug two directions simultaneously.',
        studentOutcome: 'Each team shows a temperature publication and an ON/OFF command reaching the LED.',
        build: {
          name: 'Classroom telemetry node',
          outcome: 'Publish a simulated temperature every three seconds and subscribe to an LED command topic.',
          hardware: ['ESP32 DevKit', 'Built-in LED on GPIO 2', 'USB cable', 'Wi-Fi hotspot', 'MQTT client'],
          steps: [
            'Change the Wi-Fi credentials and replace team01 with the team’s assigned number.',
            'Upload the sketch and confirm Wi-Fi + broker connection in Serial Monitor.',
            'Subscribe to mcsa341b/team01/temperature and capture two readings.',
            'Publish ON, then OFF, to mcsa341b/team01/led/set.',
            'Disconnect the MQTT client and predict what the ESP32 continues doing.',
          ],
          dataPath: ['Simulated sensor', 'ESP32 publisher', 'MQTT broker', 'MQTT subscriber', 'Human-visible output'],
          extension: 'Replace the simulated value with a DHT11/DHT22 reading and add timestamp, device and unit fields in JSON.',
          safety: 'The shared public broker is for class demonstrations only. Never publish passwords, personal information or production device data.',
        },
        checklist: ['Wi-Fi connected', 'MQTT connected', 'Two readings received', 'LED ON received', 'LED OFF received', 'Data path explained'],
      },
      {
        id: 'cloud-mqtt-code',
        kind: 'code',
        label: 'Trace execution',
        title: 'Where publish and subscribe happen in the ESP32',
        durationMinutes: 9,
        teacherPrompt: 'Tap each annotation only after students locate the matching responsibility in the code.',
        studentOutcome: 'Students explain why callback handles commands and loop must run continuously.',
        code: {
          filename: 'unit4_mqtt_demo.ino',
          language: 'cpp',
          listing: `#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_NAME = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_PASSWORD";
const char* BROKER = "broker.emqx.io";
const char* TEMP_TOPIC = "mcsa341b/team01/temperature";
const char* LED_TOPIC  = "mcsa341b/team01/led/set";

WiFiClient network;
PubSubClient mqtt(network);
unsigned long lastPublish = 0;

void onMessage(char* topic, byte* payload, unsigned int length) {
  String command;
  for (unsigned int i = 0; i < length; i++) command += (char)payload[i];
  command.trim();
  digitalWrite(2, command == "ON" ? HIGH : LOW);
}

void connectMqtt() {
  while (!mqtt.connected()) {
    String id = "mcsa341b-" + String((uint32_t)ESP.getEfuseMac(), HEX);
    if (mqtt.connect(id.c_str())) mqtt.subscribe(LED_TOPIC);
    else delay(1000);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);
  WiFi.begin(WIFI_NAME, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mqtt.setServer(BROKER, 1883);
  mqtt.setCallback(onMessage);
}

void loop() {
  if (!mqtt.connected()) connectMqtt();
  mqtt.loop();

  if (millis() - lastPublish >= 3000) {
    lastPublish = millis();
    float temperature = 25.0 + random(-30, 31) / 10.0;
    char value[8];
    dtostrf(temperature, 4, 1, value);
    mqtt.publish(TEMP_TOPIC, value);
    Serial.printf("Published %s C\\n", value);
  }
}`,
          walkthrough: [
            { label: 'Topics', title: 'The interface contract', detail: 'TEMP_TOPIC carries telemetry outward; LED_TOPIC carries commands inward. Topic names separate meaning without coupling publishers to subscriber addresses.' },
            { label: 'onMessage()', title: 'Subscription becomes an action', detail: 'PubSubClient calls this function when a matching message arrives. The payload is converted into a command before GPIO 2 changes.' },
            { label: 'connectMqtt()', title: 'Session and subscription', detail: 'The ESP32 identifies itself to the broker, then registers interest in the LED command topic. After reconnecting it must subscribe again.' },
            { label: 'mqtt.loop()', title: 'Keep the conversation alive', detail: 'This handles incoming packets and MQTT keep-alive traffic. Long blocking delays can make the broker treat the device as disconnected.' },
            { label: 'mqtt.publish()', title: 'Telemetry leaves the device', detail: 'The value is published to a topic. The broker—not the ESP32—decides which subscribers receive it.' },
          ],
        },
      },
      {
        id: 'cloud-check',
        kind: 'quiz',
        label: 'Check understanding',
        title: 'Can the class operate the pipeline?',
        durationMinutes: 3,
        teacherPrompt: 'Students vote before anyone explains. Ask one student who chose each distractor to state their reasoning.',
        studentOutcome: 'The class distinguishes broker, storage and dashboard responsibilities.',
        questions: [
          {
            prompt: 'Which component distributes a publication to matching subscribers?',
            options: [
              { label: 'MQTT broker', feedback: 'Correct—the broker matches publications to subscriptions.', correct: true },
              { label: 'Time-series database', feedback: 'The database stores and queries measurements; it is not the MQTT distributor.' },
              { label: 'Dashboard', feedback: 'The dashboard presents data but should not own message delivery.' },
            ],
          },
          {
            prompt: 'Why must mqtt.loop() run repeatedly?',
            options: [
              { label: 'To service incoming packets and keep-alive traffic', feedback: 'Correct. MQTT work continues between publications.', correct: true },
              { label: 'To increase Wi-Fi voltage', feedback: 'Networking software cannot change the board’s supply voltage.' },
              { label: 'To create a new topic every loop', feedback: 'Topics are names; the loop services the existing session.' },
            ],
          },
        ],
      },
      {
        id: 'cloud-exit',
        kind: 'exit',
        label: 'One-minute paper',
        title: 'Turn a reading into a decision',
        durationMinutes: 2,
        teacherPrompt: 'Collect answers before students disconnect hardware. Use the weakest stage named to open the next class.',
        studentOutcome: 'Every student submits a complete data path and one failure mode.',
        checklist: [
          'Write the five pipeline stages in order.',
          'State one field that makes a raw value trustworthy.',
          'Name one failure and where the system should handle it.',
        ],
      },
    ],
  },
  {
    id: 'unit4-edge-fog-cloud',
    unit: 4,
    session: 13,
    title: 'Decide at the Edge, Coordinate in the Fog',
    subtitle: 'Edge vs fog vs cloud through latency decisions and two fast ESP32 classroom projects',
    icon: '⚡',
    minutes: 60,
    essentialQuestion: 'Which decisions must happen beside the sensor, and which can safely wait for the cloud?',
    objectives: [
      'Classify processing tasks as edge, fog or cloud',
      'Calculate whether a stated latency budget can be met',
      'Build a local sensor-to-actuator loop on ESP32',
      'Send summaries or events instead of every unchanged sample',
    ],
    equipment: ['ESP32 DevKit', 'LDR + 10 kΩ resistor', 'LED + 220 Ω resistor', 'HC-SR04', 'Buzzer', 'Optional MQTT connection'],
    preparation: [
      'Prepare one LDR divider and one HC-SR04 station for parallel team work.',
      'Use a voltage divider on the HC-SR04 Echo output before it reaches the ESP32.',
      'Preload the local-control sketches so teams spend time testing decisions, not installing tools.',
      'Keep a stopwatch visible for the latency thought experiment.',
    ],
    slides: [
      {
        id: 'edge-hook',
        kind: 'hook',
        label: 'Make the call',
        title: 'A person is 10 cm from a moving machine. Ask the cloud?',
        durationMinutes: 5,
        teacherPrompt: 'Count aloud for 300 ms before revealing the answer. Ask what can go wrong between sensor and cloud.',
        studentOutcome: 'Students state that safety control needs a local path even when cloud monitoring exists.',
        poll: {
          question: 'Where should the emergency-stop decision execute?',
          options: [
            { label: 'ESP32 beside the sensor', feedback: 'Correct. The safety path stays local and deterministic.', correct: true },
            { label: 'Remote cloud function', feedback: 'Cloud analytics can record the event, but network delay and failure make it unsuitable as the only stop path.' },
            { label: 'Dashboard browser', feedback: 'A dashboard informs people; it should not be the sole real-time safety controller.' },
          ],
        },
        cards: [
          { title: 'Fast path', body: 'Sensor → local decision → actuator. It continues when the internet fails.', accent: 'green' },
          { title: 'Insight path', body: 'Event → gateway/cloud → history, fleet learning and long-term optimization.', accent: 'blue' },
        ],
      },
      {
        id: 'edge-plan',
        kind: 'plan',
        label: '60-minute route',
        title: 'Concept, calculation, build and defence',
        durationMinutes: 3,
        teacherPrompt: 'Split the room into LDR and distance-alarm teams. Each team must defend why its first decision is local.',
        studentOutcome: 'Teams know their build station and final defence question.',
        timeline: [
          { minutes: '0–5', title: 'Safety hook', teacherAction: 'Force a location decision.', studentEvidence: 'Choose the edge and state why.' },
          { minutes: '5–8', title: 'Assign project stations', teacherAction: 'Split LDR and distance-alarm teams.', studentEvidence: 'Repeat the team defence question.' },
          { minutes: '8–18', title: 'Place the compute', teacherAction: 'Reveal edge, fog and cloud.', studentEvidence: 'Classify six tasks.' },
          { minutes: '18–26', title: 'Latency budget', teacherAction: 'Work one throughput calculation.', studentEvidence: 'Compare 300 ms and 12 ms.' },
          { minutes: '26–48', title: 'Parallel ESP32 build', teacherAction: 'Run two project stations.', studentEvidence: 'Demonstrate a local closed loop.' },
          { minutes: '48–55', title: 'Code-to-architecture', teacherAction: 'Identify local and remote paths.', studentEvidence: 'Mark the edge boundary.' },
          { minutes: '55–58', title: 'Architecture vote', teacherAction: 'Challenge each placement.', studentEvidence: 'Defend it with a constraint.' },
          { minutes: '58–60', title: 'Exit rule', teacherAction: 'Collect one-sentence rules.', studentEvidence: 'Submit a reusable placement rule.' },
        ],
      },
      {
        id: 'edge-zones',
        kind: 'concept',
        label: 'Tap the compute zone',
        title: 'Edge, fog and cloud are locations of responsibility',
        durationMinutes: 10,
        teacherPrompt: 'Call out a task—emergency stop, building average, annual model training—and have students point before tapping a zone.',
        studentOutcome: 'Students place work using latency, bandwidth, privacy and fleet scope.',
        flow: [
          { label: 'Edge · device', detail: 'Runs beside the sensor or actuator. Best for immediate response, offline continuity and privacy-sensitive filtering.', packet: 'distance < 20 cm → buzzer now' },
          { label: 'Fog · local gateway', detail: 'Coordinates several nearby devices, translates protocols, buffers data and applies site-wide rules.', packet: 'floor-2 gateway → room summaries' },
          { label: 'Cloud · shared service', detail: 'Stores long histories, coordinates many sites and runs fleet-scale analytics or training.', packet: 'all campuses → seasonal model' },
        ],
        cards: [
          { title: 'Placement test', kicker: 'Latency', body: 'Can the decision wait for a network round trip?', accent: 'red' },
          { title: 'Placement test', kicker: 'Bandwidth', body: 'Can a small event or feature replace a continuous raw stream?', accent: 'gold' },
          { title: 'Placement test', kicker: 'Scope', body: 'Does the decision concern one device, one site or the entire fleet?', accent: 'blue' },
          { title: 'Placement test', kicker: 'Failure', body: 'What must still work after the gateway or internet disappears?', accent: 'green' },
        ],
      },
      {
        id: 'edge-latency',
        kind: 'compare',
        label: 'Calculate',
        title: 'A latency number becomes meaningful only against a deadline',
        durationMinutes: 8,
        teacherPrompt: 'Let pairs calculate for two minutes, then tap the choices. Keep assumptions explicit: one sequential inference stream.',
        studentOutcome: 'Students compare service time with arrival interval and retain safety margin.',
        cards: [
          { title: 'Production rate', kicker: '200 items/min', body: 'A new item arrives every 60 ÷ 200 = 0.30 seconds, or 300 ms.', accent: 'navy' },
          { title: 'Cloud inference', kicker: '300 ms/item', body: 'Theoretical maximum is 3.33 items/s = 200/min. It has zero margin for upload, queueing or failures.', accent: 'red' },
          { title: 'Edge inference', kicker: '12 ms/item', body: 'Theoretical maximum is 83.3 items/s = 5,000/min before other constraints. Plenty of processing margin.', accent: 'green' },
          { title: 'Hybrid', kicker: '12 ms local + summary', body: 'Reject defects immediately; send events and selected evidence to the cloud for history and retraining.', accent: 'blue' },
        ],
        poll: {
          question: 'Is cloud-only safe at exactly 200 items/min under these assumptions?',
          options: [
            { label: 'Yes, comfortably', feedback: 'No. Its theoretical service rate only equals the arrival rate; any overhead creates a queue.' },
            { label: 'No, it has no latency margin', feedback: 'Correct. A usable design needs margin for transfer, queueing and variation.', correct: true },
            { label: 'Impossible to compare', feedback: 'We can compare because both arrival interval and inference time are given, while stating the sequential-processing assumption.' },
          ],
        },
      },
      {
        id: 'edge-projects',
        kind: 'activity',
        label: '22-minute team build',
        title: 'Two projects, one edge-computing principle',
        durationMinutes: 22,
        teacherPrompt: 'Half the teams build the light controller; half build the distance alarm. At minute 40, force “internet unavailable” and ask what still works.',
        studentOutcome: 'Teams demonstrate a local loop and identify the optional telemetry path.',
        cards: [
          { title: 'Team A · Smart light', kicker: 'LDR → decision → LED', body: 'Read the light level, compare it with a threshold and switch the LED locally. Optional: publish only state changes.', accent: 'gold' },
          { title: 'Team B · Distance alarm', kicker: 'HC-SR04 → decision → buzzer', body: 'Green above 50 cm, yellow from 20–50 cm, red + buzzer below 20 cm. Optional: publish danger events.', accent: 'red' },
        ],
        build: {
          name: 'Edge-first sensing station',
          outcome: 'The actuator responds locally even when no broker or internet is available.',
          hardware: ['ESP32', 'Team A: LDR + 10 kΩ + LED', 'Team B: HC-SR04 + divider + LEDs/buzzer'],
          steps: [
            'Wire and print the raw sensor reading before controlling any output.',
            'Select a threshold from observed classroom values instead of copying a magic number.',
            'Add the local actuator rule and test both sides of the threshold.',
            'Disconnect Wi-Fi or disable telemetry; verify the control action still works.',
            'State what event or summary would be useful to a remote dashboard.',
          ],
          dataPath: ['Physical condition', 'ESP32 sensor read', 'Local rule', 'Immediate actuator', 'Optional event to cloud'],
          extension: 'Publish only state transitions such as NORMAL→DANGER, reducing bandwidth while preserving important evidence.',
          safety: 'Use a resistor with every LED and a voltage divider on the 5 V HC-SR04 Echo signal.',
        },
        checklist: ['Raw value visible', 'Threshold justified', 'Local output works', 'Offline test passed', 'Optional cloud event defined'],
      },
      {
        id: 'edge-code',
        kind: 'code',
        label: 'Read the control loop',
        title: 'Local action first; telemetry second',
        durationMinutes: 7,
        teacherPrompt: 'Ask students to draw a line after the safety action. Everything below that line is allowed to fail without stopping the LED response.',
        studentOutcome: 'Students separate the control path from the observability path.',
        code: {
          filename: 'edge_smart_light.ino',
          language: 'cpp',
          listing: `const int LDR_PIN = 34;
const int LED_PIN = 2;
const int DARK_THRESHOLD = 1800;

bool previousDark = false;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  analogReadResolution(12);
}

void loop() {
  int light = analogRead(LDR_PIN);
  bool isDark = light < DARK_THRESHOLD;

  // Safety / control path: no network dependency.
  digitalWrite(LED_PIN, isDark ? HIGH : LOW);

  // Observability path: report only meaningful state changes.
  if (isDark != previousDark) {
    Serial.printf("state=%s,light=%d\\n", isDark ? "DARK" : "BRIGHT", light);
    // mqtt.publish("mcsa341b/team01/light/state", isDark ? "DARK" : "BRIGHT");
    previousDark = isDark;
  }

  delay(100);
}`,
          walkthrough: [
            { label: 'Sample', title: 'Read evidence', detail: 'The ADC converts the LDR divider voltage into a number. Teams must observe their own room before choosing a threshold.' },
            { label: 'Decide', title: 'Compute beside the sensor', detail: 'The comparison executes on the ESP32, so the response does not wait for Wi-Fi, broker or cloud.' },
            { label: 'Act', title: 'Close the loop locally', detail: 'digitalWrite changes the physical output immediately after the decision.' },
            { label: 'Summarise', title: 'Transmit information, not repetition', detail: 'The code reports only when the state changes. This reduces messages and makes each publication meaningful.' },
          ],
        },
      },
      {
        id: 'edge-check',
        kind: 'quiz',
        label: 'Architecture vote',
        title: 'Where should this responsibility live?',
        durationMinutes: 3,
        teacherPrompt: 'Require a “because” after every answer. Location without a reason earns no mark.',
        studentOutcome: 'Students defend placements using an engineering constraint.',
        questions: [
          {
            prompt: 'Stop a motor when a hand enters a danger zone.',
            options: [
              { label: 'Edge', feedback: 'Correct. Immediate safety action must not depend on a remote connection.', correct: true },
              { label: 'Fog only', feedback: 'A gateway can coordinate the site, but it should not be the only emergency-stop path.' },
              { label: 'Cloud only', feedback: 'A cloud round trip introduces avoidable delay and a network dependency.' },
            ],
          },
          {
            prompt: 'Train a model using one year of data from 10,000 devices.',
            options: [
              { label: 'ESP32 edge', feedback: 'A single endpoint lacks the fleet-wide data and training resources.' },
              { label: 'Cloud', feedback: 'Correct. Fleet-scale history and elastic compute fit the cloud responsibility.', correct: true },
              { label: 'Sensor pin', feedback: 'A pin supplies or samples a signal; it is not a compute service.' },
            ],
          },
        ],
      },
      {
        id: 'edge-exit',
        kind: 'exit',
        label: 'Exit rule',
        title: 'Write your placement rule in one sentence',
        durationMinutes: 2,
        teacherPrompt: 'Ask for a rule that mentions at least two constraints, not a definition copied from the slide.',
        studentOutcome: 'Every student writes a reusable edge/fog/cloud decision rule.',
        checklist: [
          'Name the decision.',
          'Choose edge, fog or cloud.',
          'Justify with latency, bandwidth, privacy, scope or failure tolerance.',
        ],
      },
    ],
  },
  {
    id: 'unit4-analytics-decisions',
    unit: 4,
    session: 14,
    title: 'From Dashboard to Decision',
    subtitle: 'Analytics levels, anomaly detection, digital twins and two ESP32 dashboard projects in 60 minutes',
    icon: '📊',
    minutes: 60,
    essentialQuestion: 'How do we turn a stream of readings into an explainable action?',
    objectives: [
      'Move from descriptive to diagnostic, predictive and prescriptive analytics',
      'Distinguish a threshold event from a statistical anomaly',
      'Design a dashboard around a decision instead of decorating raw data',
      'Connect an ESP32 control or monitoring project to an evidence panel',
    ],
    equipment: ['ESP32 DevKit', 'DHT11/DHT22 or simulated values', 'LED + 220 Ω resistor', 'Wi-Fi hotspot', 'MQTT client or local web dashboard'],
    preparation: [
      'Prepare a small set of normal and abnormal temperature readings.',
      'Keep the Session 12 MQTT sketch available as the telemetry starting point.',
      'Pre-open the chosen MQTT client or local dashboard.',
      'Assign half the class to monitoring and half to remote control.',
    ],
    slides: [
      {
        id: 'analytics-hook',
        kind: 'hook',
        label: 'Notice, then explain',
        title: 'The temperature is 38°C. Is that a problem?',
        durationMinutes: 5,
        teacherPrompt: 'Do not provide a threshold or history initially. Add context one card at a time and allow students to revise their answer.',
        studentOutcome: 'Students recognize that a value needs baseline, context and decision rules.',
        cards: [
          { title: '38°C', kicker: 'Current value', body: 'Describes the present, but does not reveal whether it is expected.', accent: 'navy' },
          { title: 'Usual range: 24–29°C', kicker: 'Baseline', body: 'Now the reading appears unusual relative to history.', accent: 'gold' },
          { title: 'Sensor beside a heater', kicker: 'Context', body: 'A local cause may explain the change without indicating a room-wide event.', accent: 'blue' },
          { title: 'Protect equipment above 35°C', kicker: 'Decision rule', body: 'The system now has a reason to alert or act.', accent: 'red' },
        ],
        poll: {
          question: 'What should the system do first?',
          options: [
            { label: 'Delete the reading', feedback: 'No. Preserve evidence unless validation proves it invalid.' },
            { label: 'Flag it and collect context', feedback: 'Correct. Mark the event, preserve evidence and inspect related signals.', correct: true },
            { label: 'Assume the sensor is broken', feedback: 'Possible, but that is a hypothesis to test rather than a conclusion.' },
          ],
        },
      },
      {
        id: 'analytics-plan',
        kind: 'plan',
        label: '60-minute route',
        title: 'Move from data to an explainable action',
        durationMinutes: 3,
        teacherPrompt: 'Set the success condition: every team must show a value, its state, and the action a person should take.',
        studentOutcome: 'Teams understand that the output is a decision panel, not merely a chart.',
        timeline: [
          { minutes: '0–5', title: 'Context hook', teacherAction: 'Reveal context progressively.', studentEvidence: 'Revise a decision with evidence.' },
          { minutes: '5–8', title: 'Set the success condition', teacherAction: 'Assign monitoring and control teams.', studentEvidence: 'State the panel’s intended decision.' },
          { minutes: '8–18', title: 'Analytics ladder', teacherAction: 'Ask four different questions of one dataset.', studentEvidence: 'Classify the question level.' },
          { minutes: '18–26', title: 'Find the anomaly', teacherAction: 'Compare threshold and baseline methods.', studentEvidence: 'Explain why one point is unusual.' },
          { minutes: '26–46', title: 'Dashboard project', teacherAction: 'Run monitor and controller teams.', studentEvidence: 'Show state + action + evidence.' },
          { minutes: '46–53', title: 'Digital twin', teacherAction: 'Test a change before applying it.', studentEvidence: 'Separate model from physical asset.' },
          { minutes: '53–58', title: 'Decision check', teacherAction: 'Run decision-focused critique.', studentEvidence: 'Name the evidence each claim needs.' },
          { minutes: '58–60', title: 'Dashboard redesign', teacherAction: 'Collect one replacement decision.', studentEvidence: 'Submit a user, decision, evidence and action.' },
        ],
      },
      {
        id: 'analytics-ladder',
        kind: 'concept',
        label: 'Tap the question',
        title: 'Four analytics levels use the same evidence differently',
        durationMinutes: 10,
        teacherPrompt: 'Keep one example throughout: repeated overheating in classroom 04. Students predict the next question before tapping.',
        studentOutcome: 'Students distinguish the four levels by the question answered.',
        flow: [
          { label: 'Descriptive', detail: 'What happened? Summarise observed values and events without claiming a cause.', packet: 'Temperature crossed 35°C four times today.' },
          { label: 'Diagnostic', detail: 'Why did it happen? Compare related evidence and test possible causes.', packet: 'All spikes followed afternoon occupancy and fan-off state.' },
          { label: 'Predictive', detail: 'What is likely next? Estimate a future state and uncertainty from patterns.', packet: 'At the current rise, 35°C is likely within 12 minutes.' },
          { label: 'Prescriptive', detail: 'What should we do? Evaluate possible actions, constraints and consequences.', packet: 'Start ventilation now; notify staff if no drop occurs in 5 minutes.' },
        ],
        cards: [
          { title: 'Evidence rule', body: 'A higher analytics level does not repair weak input data. Predictions inherit sensor, timing and context errors.', accent: 'red' },
          { title: 'Human rule', body: 'For consequential actions, show why the rule fired and what evidence supports it.', accent: 'green' },
        ],
      },
      {
        id: 'analytics-anomaly',
        kind: 'compare',
        label: 'Find the unusual point',
        title: 'Threshold violation and anomaly are related, not identical',
        durationMinutes: 8,
        teacherPrompt: 'Ask which point deserves investigation: 31°C in a stable 25°C room or 36°C in a process that normally runs 34–38°C.',
        studentOutcome: 'Students use both engineering limits and learned baselines.',
        cards: [
          { title: 'Fixed threshold', kicker: 'Known engineering limit', body: 'Simple and explainable: alert whenever temperature > 35°C. It may miss unusual values below the limit.', accent: 'red' },
          { title: 'Statistical anomaly', kicker: 'Different from baseline', body: 'Flags a value far from recent behaviour, such as more than two standard deviations from a rolling mean.', accent: 'gold' },
          { title: 'Contextual anomaly', kicker: 'Wrong for this situation', body: 'A reading may be normal at noon but unexpected at midnight or normal for one machine but not another.', accent: 'blue' },
        ],
        poll: {
          question: 'A motor normally vibrates around 1.0±0.1 mm/s. Today it reads 1.5 mm/s, below the 2.0 safety limit. What is it?',
          options: [
            { label: 'Normal because it is below 2.0', feedback: 'It does not violate the safety threshold, but it is far from its usual baseline.' },
            { label: 'A statistical anomaly worth investigating', feedback: 'Correct. An anomaly can appear before a hard limit is crossed.', correct: true },
            { label: 'Proof the motor will fail', feedback: 'An anomaly is evidence for investigation, not proof of a future failure.' },
          ],
        },
      },
      {
        id: 'analytics-projects',
        kind: 'activity',
        label: '20-minute dashboard build',
        title: 'Two teams: observe a system or control it',
        durationMinutes: 20,
        teacherPrompt: 'Monitoring teams must show evidence and state. Control teams must show command, acknowledgement and final state.',
        studentOutcome: 'Teams demonstrate a small dashboard that supports one explicit decision.',
        cards: [
          { title: 'Team A · Environment monitor', kicker: 'DHT → MQTT → dashboard', body: 'Show latest temperature/humidity, normal/warning state and a short trend. If no DHT is available, use simulated readings.', accent: 'green' },
          { title: 'Team B · Wi-Fi/MQTT light', kicker: 'Command → ESP32 → acknowledgement', body: 'Send ON/OFF from a client and display the device’s reported final state, not only the requested command.', accent: 'blue' },
          { title: 'Earlier project · Smart light', kicker: 'Edge + analytics', body: 'Count how often the light switches and ask whether the threshold causes rapid oscillation near dusk.', accent: 'gold' },
          { title: 'Earlier project · Distance alarm', kicker: 'Edge + event history', body: 'Keep the alarm local, but chart DANGER events to find risky periods or locations.', accent: 'red' },
        ],
        build: {
          name: 'Decision-first IoT panel',
          outcome: 'A viewer can see what is happening, why it matters and what action is expected.',
          hardware: ['ESP32', 'DHT11/DHT22 or simulated telemetry', 'LED', 'MQTT client or ESP32 web page'],
          steps: [
            'State the decision the panel must support in one sentence.',
            'Show the current value or requested command.',
            'Add a clearly labelled NORMAL, WARNING or OFFLINE state.',
            'Show supporting evidence: recent values, acknowledgement or last-update time.',
            'Force one abnormal or disconnected state and verify that the panel makes it visible.',
          ],
          dataPath: ['ESP32 measurement/command', 'Transport', 'Rule or acknowledgement', 'Decision panel', 'Human action'],
          extension: 'Store recent samples and show a rolling mean so students can compare fixed thresholds with baseline anomalies.',
        },
        checklist: ['Decision stated', 'Latest evidence visible', 'State labelled', 'Failure visible', 'Action understandable'],
      },
      {
        id: 'analytics-twin',
        kind: 'concept',
        label: 'Test before acting',
        title: 'A digital twin is a model connected to evidence',
        durationMinutes: 7,
        teacherPrompt: 'Change one model input—fan speed—and ask whether the physical classroom changes. Then distinguish simulation from actuation.',
        studentOutcome: 'Students separate physical asset, data connection, model and tested decision.',
        flow: [
          { label: 'Physical asset', detail: 'The real classroom, motor, farm or machine produces measurements and receives approved commands.', packet: 'temperature, humidity, fan state' },
          { label: 'Live data link', detail: 'Telemetry keeps the model aligned with the current condition and exposes stale or missing evidence.', packet: 'last update: 4 s ago' },
          { label: 'Computational model', detail: 'A simplified representation estimates how the system might respond to a change.', packet: 'simulate fan 40% → 80%' },
          { label: 'Decision gate', detail: 'People or validated automation compare outcomes before changing the physical asset.', packet: 'expected drop: 3°C in 8 min' },
        ],
        poll: {
          question: 'If a dashboard only mirrors the latest sensor value, is it a digital twin?',
          options: [
            { label: 'Yes, every dashboard is a twin', feedback: 'A display alone lacks a behavioural model for testing possible changes.' },
            { label: 'No, it needs a model of behaviour', feedback: 'Correct. A twin connects evidence to a model that can estimate system response.', correct: true },
            { label: 'Only if the chart is 3D', feedback: 'Visual appearance does not define a digital twin.' },
          ],
        },
      },
      {
        id: 'analytics-check',
        kind: 'quiz',
        label: 'Decision check',
        title: 'What does this dashboard actually know?',
        durationMinutes: 5,
        teacherPrompt: 'For each answer, ask students to name the evidence required before the claim is allowed.',
        studentOutcome: 'Students avoid overstating what a chart or anomaly detector proves.',
        questions: [
          {
            prompt: '“The temperature crossed 35°C four times.” Which analytics level?',
            options: [
              { label: 'Descriptive', feedback: 'Correct. It reports what the recorded data shows.', correct: true },
              { label: 'Diagnostic', feedback: 'Diagnostic analytics would investigate why the crossings occurred.' },
              { label: 'Prescriptive', feedback: 'Prescriptive analytics recommends an action.' },
            ],
          },
          {
            prompt: 'What is the strongest proof that a remote LED command succeeded?',
            options: [
              { label: 'The button changed colour', feedback: 'That confirms only a local interface change.' },
              { label: 'The broker accepted the command', feedback: 'Broker acceptance does not prove the device acted.' },
              { label: 'The ESP32 reports its measured final state', feedback: 'Correct. Device acknowledgement closes the evidence loop.', correct: true },
            ],
          },
        ],
      },
      {
        id: 'analytics-exit',
        kind: 'exit',
        label: 'Dashboard redesign',
        title: 'Replace one chart with a better decision',
        durationMinutes: 2,
        teacherPrompt: 'Students must remove or change one element—not simply add more information.',
        studentOutcome: 'Every student states a user, decision, evidence and action for one panel.',
        checklist: [
          'Who is the user?',
          'What decision must they make?',
          'Which minimum evidence supports it?',
          'What state or action must be unmistakable?',
        ],
      },
    ],
  },
]

export function getUnit4Deck(id: string): TeachingDeck | undefined {
  return UNIT4_DECKS.find((deck) => deck.id === id)
}
