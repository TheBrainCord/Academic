export type TeachingSlideKind =
  | 'hook'
  | 'plan'
  | 'concept'
  | 'compare'
  | 'activity'
  | 'code'
  | 'quiz'
  | 'exit'

export interface TeachingDeckOption {
  label: string
  feedback: string
  correct?: boolean
}

export interface TeachingDeckCard {
  title: string
  body: string
  kicker?: string
  accent?: 'navy' | 'saffron' | 'green' | 'gold' | 'red' | 'blue'
}

export interface TeachingDeckFlowStep {
  label: string
  detail: string
  packet?: string
}

export interface TeachingDeckTimelineItem {
  minutes: string
  title: string
  teacherAction: string
  studentEvidence: string
}

export interface TeachingDeckBuild {
  name: string
  outcome: string
  hardware: string[]
  steps: string[]
  dataPath: string[]
  extension?: string
  safety?: string
}

export interface TeachingDeckCode {
  filename: string
  language: 'cpp' | 'python' | 'json'
  listing: string
  walkthrough: Array<{
    label: string
    title: string
    detail: string
  }>
}

export interface TeachingDeckQuestion {
  prompt: string
  options: TeachingDeckOption[]
}

export interface TeachingSlide {
  id: string
  kind: TeachingSlideKind
  label: string
  title: string
  subtitle?: string
  durationMinutes: number
  teacherPrompt: string
  studentOutcome: string
  cards?: TeachingDeckCard[]
  flow?: TeachingDeckFlowStep[]
  timeline?: TeachingDeckTimelineItem[]
  poll?: {
    question: string
    options: TeachingDeckOption[]
  }
  build?: TeachingDeckBuild
  code?: TeachingDeckCode
  questions?: TeachingDeckQuestion[]
  checklist?: string[]
}

export interface TeachingDeck {
  id: string
  unit: number
  session: number
  title: string
  subtitle: string
  icon: string
  minutes: number
  essentialQuestion: string
  objectives: string[]
  equipment: string[]
  preparation: string[]
  slides: TeachingSlide[]
}
