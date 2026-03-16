import Anthropic from '@anthropic-ai/sdk'

// Server-side only — never import this from client components
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface IdeaExploreResult {
  refined_title:      string
  novelty:            string
  problem_statement:  string
  options: Array<{
    angle:       string
    description: string
    phases:      string[]
    venue:       string
  }>
}

export async function exploreResearchIdea(rawIdea: string): Promise<IdeaExploreResult> {
  const message = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a research mentor at an IoT engineering programme.
A student has a rough idea: "${rawIdea}"

Return a JSON object with:
- refined_title: a crisp IEEE-style title
- novelty: 1 sentence on what makes this novel
- problem_statement: 2-3 sentences
- options: array of exactly 3 objects, each with:
  - angle: the research angle (e.g. "Security-first", "Energy-efficient", "ML-enhanced")
  - description: 2 sentences
  - phases: array of 4 phase titles
  - venue: best target conference/journal (e.g. "IEEE IoT Journal", "ICTCE 2025")

Return only valid JSON, no markdown.`,
    }],
  })

  const text = (message.content[0] as any).text
  return JSON.parse(text) as IdeaExploreResult
}

export async function suggestNextSteps(phase: {
  title:               string
  description:         string
  student_observation: string
  status:              string
}): Promise<string[]> {
  const message = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `IoT research phase: "${phase.title}"
Description: ${phase.description}
Current observation: ${phase.student_observation ?? 'none yet'}
Status: ${phase.status}

Give exactly 4 specific, actionable next steps as a JSON array of strings.
Each step should be concrete (include tools, datasets, or measurements).
Return only the JSON array.`,
    }],
  })

  const text = (message.content[0] as any).text
  return JSON.parse(text) as string[]
}
