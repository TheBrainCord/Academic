// Shared contract for interactive lecture modules ("teach without PPT").
// Pure data — content lives in /content/lectures, the viewer in
// /components/lectures. Every module follows the same 4-part structure:
// 1. Hardware physics from scratch  2. Simulator wiring  3. Code execution
// breakdown  4. M.Sc. research spark — rendered as step-by-step slides.

export interface AsciiDiagram {
  /** Monospace ASCII art shown in a terminal-styled block */
  art: string
  caption: string
}

export interface PhysicsConcept {
  heading: string
  /** 2–4 paragraphs separated by \n\n — the "from scratch" explanation */
  body: string
  diagram?: AsciiDiagram
}

export interface WiringStep {
  from: string
  to: string
  /** The electrical purpose of this exact connection */
  purpose: string
}

export interface CodeWalkStep {
  /** Which lines this step explains, e.g. "Lines 1–6" */
  lines: string
  heading: string
  /** What happens in registers / memory / on the bus when this runs */
  body: string
}

export interface LectureModule {
  id: string
  unit: number
  session: number
  title: string
  subtitle: string
  icon: string
  /** Suggested teaching time in minutes */
  minutes: number
  /** Board used in part 2 & 3, e.g. 'ESP32 DevKit' */
  board: string

  physics: {
    intro: string
    concepts: PhysicsConcept[]
  }

  wiring: {
    intro: string
    steps: WiringStep[]
    /** Challenge id in the Virtual Lab that mirrors this circuit, if any */
    labChallengeId?: string
    labNote: string
  }

  code: {
    language: 'cpp' | 'python'
    /** Production-ready, fully commented, paste-and-run */
    listing: string
    walkthrough: CodeWalkStep[]
  }

  research: {
    title: string
    brief: string
    objectives: string[]
    constraints: string[]
  }
}
