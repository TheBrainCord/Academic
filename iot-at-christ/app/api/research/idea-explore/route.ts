import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { exploreResearchIdea } from '@/lib/anthropic/research-suggest'
import { z } from 'zod'

const schema = z.object({ rawIdea: z.string().min(10).max(500) })

// Rate limit: 10 AI requests per student per hour (tracked in DB)
const HOURLY_LIMIT = 10

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check rate limit
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('ai_usage_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)

  if ((count ?? 0) >= HOURLY_LIMIT) {
    return NextResponse.json({ error: 'Rate limit exceeded — 10 AI requests per hour' }, { status: 429 })
  }

  const body = schema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const result = await exploreResearchIdea(body.data.rawIdea)

  // Log usage
  await supabase.from('ai_usage_log').insert({ user_id: user.id, endpoint: 'idea-explore' })

  return NextResponse.json(result)
}
