import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { draftPaperSection } from '@/lib/anthropic/paper-draft'
import { z } from 'zod'

const schema = z.object({
  projectId:   z.string().uuid(),
  sectionType: z.string(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Fetch project + phases (ownership verified by RLS)
  const { data: project } = await supabase
    .from('research_projects')
    .select('*, research_phases(*)')
    .eq('id', body.data.projectId)
    .eq('owner_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const draft = await draftPaperSection(project, body.data.sectionType)

  await supabase.from('ai_usage_log').insert({ user_id: user.id, endpoint: 'ai-draft' })

  return NextResponse.json({ draft })
}
