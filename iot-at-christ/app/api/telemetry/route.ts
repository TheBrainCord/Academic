import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  eventType: z.enum(['lab_view', 'sign_in', 'challenge_completed', 'sketch_run']),
  sessionId: z.string().min(1).max(100),
  path: z.string().max(200).optional(),
  boardId: z.string().max(50).optional(),
  challengeId: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Records a Virtual Lab / Simulator usage event. Open to anonymous visitors
// (no login required for /lab) — RLS restricts reads to teachers/coordinators.
export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { eventType, sessionId, path, boardId, challengeId, metadata } = body.data

  await supabase.from('simulator_events').insert({
    event_type: eventType,
    session_id: sessionId,
    user_id: user?.id ?? null,
    path,
    board_id: boardId,
    challenge_id: challengeId,
    metadata,
  })

  return NextResponse.json({ ok: true })
}
