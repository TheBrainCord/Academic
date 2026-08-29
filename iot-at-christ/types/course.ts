/** Data contracts for the weekend Course Studio.  Content deliberately lives outside
 * React so it can also drive printouts, the teacher board and validation tests. */
export type StudioActivityKind =
  | 'welcome'
  | 'concept'
  | 'demonstration'
  | 'build'
  | 'reflection'
  | 'assessment'

export interface StudioScheduleItem {
  id: string
  title: string
  durationMinutes: number
  kind: StudioActivityKind
  teacherPrompt: string
  studentOutcome: string
}

export interface StudioQuizQuestion {
  id: string
  question: string
  options: string[]
  /** Zero-based index into options. */
  correctAnswer: number
  explanation: string
}

export interface StudioPreparation {
  student: string[]
  teacher: string[]
  equipment: string[]
}

export interface StudioExam {
  title: string
  instructions: string
  durationMinutes: number
  passingPercentage: number
  criteria: string[]
}

export interface WeeklyPlan {
  id: string
  week: number
  title: string
  subtitle: string
  icon: string
  durationMinutes: number
  essentialQuestion: string
  learningObjectives: string[]
  preparation: StudioPreparation
  schedule: StudioScheduleItem[]
  quiz: StudioQuizQuestion[]
  exam: StudioExam
}
