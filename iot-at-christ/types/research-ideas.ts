export type IdeaDomain =
  | 'healthcare'
  | 'agriculture'
  | 'smart-city'
  | 'defence'
  | 'environment'
  | 'industrial'

export type IdeaDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface ResearchIdea {
  /** URL-safe slug, unique across the bank */
  id: string
  title: string
  domain: IdeaDomain
  difficulty: IdeaDifficulty
  /** 2–3 sentences: what the project is and why it matters */
  summary: string
  /** Who benefits and how — concrete, India-relevant where natural */
  realWorldValue: string
  /** The open question that makes this publishable, not just buildable */
  researchAngle: string
  /** Boards / modules, e.g. 'ESP32', 'Raspberry Pi 4', 'LoRa SX1278' */
  hardware: string[]
  sensors: string[]
  /** 4–6 IEEE-style keywords */
  paperKeywords: string[]
  /** Real venue NAMES only — never fabricated paper citations */
  suggestedVenues: string[]
  /** Can the basics be prototyped in the platform's Virtual Lab? */
  simulatorFriendly: boolean
}
