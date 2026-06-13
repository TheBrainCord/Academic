import Anthropic from '@anthropic-ai/sdk'

// Server-side only
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// IEEE paper section order (write Related Work before Abstract)
export const PAPER_SECTIONS = [
  { key: 'related_work',   label: 'Related Work',   order: 1 },
  { key: 'methodology',    label: 'Methodology',    order: 2 },
  { key: 'implementation', label: 'Implementation', order: 3 },
  { key: 'results',        label: 'Results',        order: 4 },
  { key: 'discussion',     label: 'Discussion',     order: 5 },
  { key: 'conclusion',     label: 'Conclusion',     order: 6 },
  { key: 'abstract',       label: 'Abstract',       order: 7 },
]

export async function draftPaperSection(
  project: {
    title:          string
    domain:         string
    abstract?:      string
    research_phases: Array<{ title: string; description: string; student_observation: string; status: string }>
  },
  sectionType: string
): Promise<string> {
  const phasesSummary = project.research_phases
    .map(p => `Phase: ${p.title}\nObservation: ${p.student_observation ?? 'In progress'}`)
    .join('\n\n')

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are helping an M.Tech student write an IEEE conference paper.
Project: "${project.title}" in domain: ${project.domain}

Research phases completed:
${phasesSummary}

Write the "${sectionType}" section of the paper.
- Use IEEE paper style (formal, third person, no bullet points)
- 200-300 words
- Base it ONLY on the student's actual observations above — do not invent results
- This is a DRAFT to help the student start — they will edit it
- Return only the section text, no heading`,
    }],
  })

  return (message.content[0] as any).text
}
