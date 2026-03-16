import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { suggestNextSteps } from '@/lib/anthropic/research-suggest'
import { z } from 'zod'

const schema = z.object({
  projectId: z.string().uuid(),
  phaseId:   z.string().uuid(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Verify ownership via RLS — this query will return nothing if not owner
  const { data: phase } = await supabase
    .from('research_phases')
    .select('*, research_projects!inner(owner_id, title)')
    .eq('id', body.data.phaseId)
    .eq('research_projects.owner_id', user.id)
    .single()

  if (!phase) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })

  const suggestions = await suggestNextSteps(phase)

  // Persist suggestions to the phase
  await supabase.from('research_phases')
    .update({ ai_suggestions: suggestions })
    .eq('id', body.data.phaseId)

  await supabase.from('ai_usage_log').insert({ user_id: user.id, endpoint: 'ai-suggest' })

  return NextResponse.json({ suggestions })
}
