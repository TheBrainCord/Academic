/** Authoring contracts for evidence-led hardware lessons (not simulator state). */

export type HardwareBoardId = 'arduino-uno' | 'esp32-devkit-v1' | 'raspberry-pi'
export type LessonStatus = 'complete' | 'future'
export type LearningLevel = 'beginner' | 'msc'

export interface ElectricalRequirements {
  supplyVoltage: string
  logicVoltage: string
  recommendedGpioCurrentMa: number
  cautions: string[]
}

export interface BoardPin {
  id: string
  labels: string[]
  physicalPin?: number
  capabilities: ('digital-input' | 'digital-output' | 'pwm' | 'adc' | 'i2c' | 'power' | 'ground')[]
  cautions?: string[]
}

export interface HardwareBoard {
  id: HardwareBoardId
  name: string
  platform: 'Arduino' | 'ESP-IDF / Arduino' | 'Linux / Raspberry Pi OS'
  electrical: ElectricalRequirements
  pins: BoardPin[]
}

export interface ComponentPinout {
  pin: string
  role: string
  polarity?: 'positive' | 'negative' | 'not-polarised'
  notes: string
}

export interface HardwareComponent {
  id: string
  name: string
  category: 'passive' | 'input' | 'sensor' | 'actuator' | 'interface'
  status: LessonStatus
  summary: string
  pinout: ComponentPinout[]
  electrical: ElectricalRequirements
  requiredSupportingParts: string[]
  lessonId?: string
  simulationAvailable: boolean
}

export interface BoardConnection {
  boardId: HardwareBoardId
  componentPin: string
  boardPin: string
  path: string
  rationale: string
}

export interface SafetyRule {
  id: string
  severity: 'critical' | 'warning' | 'good-practice'
  rule: string
  reason: string
  evidenceCheck: string
}

export interface SupportingPart {
  componentId: string
  quantity: number
  specification?: string
  purpose: string
  alternatives?: string[]
}

export interface HardwareExperiment {
  id: string
  level: LearningLevel
  title: string
  hypothesis: string
  procedure: string[]
  measurements: string[]
  analysis: string[]
  successCriteria: string[]
}

export interface QuizOption {
  id: string
  text: string
  feedback: string
}

export interface HardwareQuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
  correctOptionId: string
  explanation: string
}

export interface HardwareCodeSection {
  boardId: HardwareBoardId
  language: 'arduino-cpp' | 'python'
  code: string
  hardwareLinks: { code: string; hardware: string; explanation: string }[]
}

export interface HardwareReference {
  id: string
  title: string
  publisher: string
  url: string
  supports: string[]
  accessedOn: string
}

export interface VerificationDate {
  scope: string
  verifiedOn: string
  method: string
  referenceIds: string[]
  reverifyBy: string
}

export interface EvidenceChecklistItem {
  id: string
  claim: string
  evidence: string
  referenceIds: string[]
  checked: boolean
}

export interface HardwareLesson {
  id: string
  status: 'complete'
  title: string
  summary: string
  outcomes: string[]
  prerequisites: string[]
  boards: HardwareBoardId[]
  components: string[]
  supportingParts: SupportingPart[]
  calculations: { title: string; formula: string; workedExamples: string[]; designNote: string }[]
  connections: BoardConnection[]
  safety: SafetyRule[]
  procedure: string[]
  codeSections: HardwareCodeSection[]
  failureModes: { symptom: string; likelyCause: string; diagnosis: string; correction: string }[]
  realWorldUses: string[]
  alternatives: { option: string; whenToUse: string; tradeOff: string }[]
  experiments: HardwareExperiment[]
  examFraming: { prompt: string; markingGuide: string[] }[]
  quiz: HardwareQuizQuestion[]
  references: HardwareReference[]
  verification: VerificationDate[]
  evidenceChecklist: EvidenceChecklistItem[]
}
