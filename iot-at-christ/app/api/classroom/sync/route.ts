import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Rate limit: 1 sync per 5 minutes per teacher
const RATE_LIMIT_MS = 5 * 60 * 1000

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit check — read most recent sync log entry
  const { data: lastSync } = await supabase
    .from('sync_log')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (lastSync && Date.now() - new Date(lastSync.created_at).getTime() < RATE_LIMIT_MS) {
    return NextResponse.json({ error: 'Rate limited — wait 5 minutes between syncs' }, { status: 429 })
  }

  // Invoke the Edge Function
  const { data, error } = await supabase.functions.invoke('sync-classroom', {
    body: { teacherId: user.id },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
