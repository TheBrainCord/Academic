import type { WeeklyPlan } from '@/types/course'

const commonTeacherPreparation = [
  'Test the demonstration on the classroom touchscreen before students arrive.',
  'Prepare one known-good circuit so faults can be isolated quickly.',
]

/** Six studio weekends that take a learner from signals to a complete IoT system. */
export const WEEKLY_PLANS: WeeklyPlan[] = [
  {
    id: 'weekend-1', week: 1, title: 'Sense the physical world', subtitle: 'Signals, voltage dividers and safe GPIO', icon: '🌡️', durationMinutes: 180,
    essentialQuestion: 'How does a physical change become trustworthy digital data?',
    learningObjectives: ['Distinguish analog and digital signals', 'Build and explain an LDR voltage divider', 'Read an ADC value safely'],
    preparation: { student: ['Review voltage, current and resistance.'], teacher: commonTeacherPreparation, equipment: ['ESP32 DevKit', 'Breadboard', 'LDR', '10 kΩ resistor', 'Multimeter'] },
    schedule: [
      { id: 'w1-observe', title: 'Observe and predict', durationMinutes: 20, kind: 'welcome', teacherPrompt: 'Vary the light and ask learners to predict voltage.', studentOutcome: 'State a testable signal prediction.' },
      { id: 'w1-signal', title: 'Signal wall', durationMinutes: 35, kind: 'concept', teacherPrompt: 'Draw the divider and animate current flow.', studentOutcome: 'Explain the divider in their own words.' },
      { id: 'w1-build', title: 'Build the light node', durationMinutes: 80, kind: 'build', teacherPrompt: 'Reveal one connection at a time; do not hand out a finished circuit.', studentOutcome: 'Wire, measure and read the sensor.' },
      { id: 'w1-debug', title: 'Fault and fix', durationMinutes: 25, kind: 'demonstration', teacherPrompt: 'Introduce a floating input and use evidence to locate it.', studentOutcome: 'Diagnose a missing reference connection.' },
      { id: 'w1-check', title: 'Exit check', durationMinutes: 20, kind: 'assessment', teacherPrompt: 'Run the quiz, then discuss reasoning rather than scores.', studentOutcome: 'Connect ADC counts to voltage.' },
    ],
    quiz: [{ id: 'w1-q1', question: 'What does an ADC return?', options: ['A sampled voltage encoded as a number', 'A Wi-Fi packet', 'A resistance with no circuit'], correctAnswer: 0, explanation: 'The ADC compares its input with a reference and returns a numeric code.' }],
    exam: { title: 'Sensor node checkout', instructions: 'Build the divider, show three stable readings and explain the signal path.', durationMinutes: 20, passingPercentage: 70, criteria: ['Safe wiring', 'Repeatable readings', 'Clear explanation'] },
  },
  {
    id: 'weekend-2', week: 2, title: 'Make devices communicate', subtitle: 'UART, I²C and observable protocols', icon: '🔌', durationMinutes: 180,
    essentialQuestion: 'How can two devices agree on the meaning and timing of bits?',
    learningObjectives: ['Compare UART and I²C', 'Identify address, data and acknowledgement', 'Use serial output as evidence'],
    preparation: { student: ['Bring the working sensor node from weekend 1.'], teacher: commonTeacherPreparation, equipment: ['ESP32 DevKit', 'I²C environmental sensor', 'Logic-analyser view'] },
    schedule: studioSchedule('w2', ['Human protocol game', 'Bus anatomy', 'Capture a transaction', 'Pair sensor build', 'Protocol check'], [20, 40, 35, 65, 20]),
    quiz: [{ id: 'w2-q1', question: 'Why can several I²C devices share two wires?', options: ['Each device has an address', 'They use different batteries', 'Only one device has ground'], correctAnswer: 0, explanation: 'The controller selects a target using its bus address.' }],
    exam: standardExam('Protocol evidence', 'Connect the sensor and annotate one valid transaction.'),
  },
  {
    id: 'weekend-3', week: 3, title: 'Act on the world', subtitle: 'PWM, transistors and closed-loop control', icon: '⚙️', durationMinutes: 180,
    essentialQuestion: 'How does a low-power decision safely control a physical load?',
    learningObjectives: ['Explain PWM duty cycle', 'Use a driver for a load', 'Create a threshold controller'],
    preparation: { student: ['Review GPIO current limits.'], teacher: commonTeacherPreparation, equipment: ['ESP32 DevKit', 'LED', 'DC fan', 'MOSFET', 'Flyback diode'] },
    schedule: studioSchedule('w3', ['Safety briefing', 'PWM on the board', 'Driver demonstration', 'Control-system build', 'Design review'], [20, 35, 35, 70, 20]),
    quiz: [{ id: 'w3-q1', question: 'Why should a motor not be powered directly by a GPIO?', options: ['Its current can exceed the GPIO rating', 'PWM cannot control motors', 'GPIO has no voltage'], correctAnswer: 0, explanation: 'A transistor driver supplies load current while the GPIO controls it.' }],
    exam: standardExam('Actuator safety review', 'Demonstrate controlled output and justify every protection component.'),
  },
  {
    id: 'weekend-4', week: 4, title: 'Connect to the network', subtitle: 'Wi-Fi, MQTT and resilient telemetry', icon: '📡', durationMinutes: 180,
    essentialQuestion: 'What makes telemetry useful when a network is unreliable?',
    learningObjectives: ['Describe publish/subscribe', 'Design a useful topic hierarchy', 'Handle disconnects without blocking sensing'],
    preparation: { student: ['Bring a laptop able to join the lab network.'], teacher: commonTeacherPreparation, equipment: ['ESP32 DevKit', 'Local MQTT broker', 'Touchscreen dashboard'] },
    schedule: studioSchedule('w4', ['Packet journey', 'MQTT roles', 'Dashboard demonstration', 'Telemetry build', 'Disconnect challenge'], [20, 35, 30, 75, 20]),
    quiz: [{ id: 'w4-q1', question: 'Which MQTT participant distributes published messages?', options: ['Broker', 'Sensor ADC', 'Router antenna'], correctAnswer: 0, explanation: 'The broker matches topic publications to subscriptions.' }],
    exam: standardExam('Resilient telemetry', 'Publish timestamped readings and recover after a forced disconnect.'),
  },
  {
    id: 'weekend-5', week: 5, title: 'Trust the system', subtitle: 'Calibration, security and failure evidence', icon: '🛡️', durationMinutes: 180,
    essentialQuestion: 'How do we know an IoT measurement and its source deserve trust?',
    learningObjectives: ['Calibrate against references', 'Separate authentication from encryption', 'Design explicit failure states'],
    preparation: { student: ['Review the telemetry payload from weekend 4.'], teacher: commonTeacherPreparation, equipment: ['Reference thermometer', 'ESP32 DevKit', 'Network dashboard'] },
    schedule: studioSchedule('w5', ['Trust map', 'Calibration lab', 'Threat-model wall', 'Harden the node', 'Peer audit'], [20, 45, 35, 60, 20]),
    quiz: [{ id: 'w5-q1', question: 'What does calibration compare a sensor against?', options: ['A traceable reference', 'Its own previous value only', 'A random network value'], correctAnswer: 0, explanation: 'A known reference reveals systematic measurement error.' }],
    exam: standardExam('Evidence audit', 'Submit calibration evidence, a threat model and one handled failure.'),
  },
  {
    id: 'weekend-6', week: 6, title: 'Deliver an IoT product', subtitle: 'Integration, field testing and technical defence', icon: '🚀', durationMinutes: 240,
    essentialQuestion: 'Can the complete system solve a real problem safely and explainably?',
    learningObjectives: ['Integrate sense, decide, communicate and act', 'Test against measurable requirements', 'Defend engineering trade-offs'],
    preparation: { student: ['Bring all prior circuits, code and evidence.', 'Prepare a one-minute problem statement.'], teacher: commonTeacherPreparation, equipment: ['Team component kits', 'Test instruments', 'Touchscreen presentation board'] },
    schedule: studioSchedule('w6', ['Mission briefing', 'Architecture review', 'Integration sprint', 'Field test', 'Demonstration and defence'], [20, 35, 105, 45, 35]),
    quiz: [{ id: 'w6-q1', question: 'Which test is strongest?', options: ['A repeatable test tied to a measurable requirement', 'A single successful demonstration', 'A test with no recorded result'], correctAnswer: 0, explanation: 'Repeatable evidence makes acceptance and diagnosis possible.' }],
    exam: { title: 'Course Studio practical', instructions: 'Demonstrate the complete system, its failure behaviour and supporting evidence.', durationMinutes: 35, passingPercentage: 70, criteria: ['Functional integration', 'Electrical safety', 'Resilience', 'Evidence-based defence'] },
  },
]

function studioSchedule(prefix: string, titles: string[], durations: number[]): WeeklyPlan['schedule'] {
  const kinds: WeeklyPlan['schedule'][number]['kind'][] = ['welcome', 'concept', 'demonstration', 'build', 'assessment']
  return titles.map((title, index) => ({ id: `${prefix}-${index + 1}`, title, durationMinutes: durations[index], kind: kinds[index], teacherPrompt: `Facilitate ${title.toLowerCase()} with predictions visible on the board.`, studentOutcome: `Produce evidence from ${title.toLowerCase()}.` }))
}

function standardExam(title: string, instructions: string): WeeklyPlan['exam'] {
  return { title, instructions, durationMinutes: 20, passingPercentage: 70, criteria: ['Working result', 'Safe practice', 'Evidence-based explanation'] }
}

export function getWeeklyPlan(id: string) {
  return WEEKLY_PLANS.find((plan) => plan.id === id)
}

export const COURSE_STUDIO_DURATION_MINUTES = WEEKLY_PLANS.reduce((total, plan) => total + plan.durationMinutes, 0)
