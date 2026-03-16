import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: project } = await supabase
    .from('research_projects')
    .select('*, research_phases(*), paper_sections(*), profiles(full_name, email)')
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // TODO: implement Puppeteer or @react-pdf/renderer IEEE two-column PDF
  // Requires Supabase paid plan for Edge Function memory (see DECISIONS.md)
  return NextResponse.json({ message: 'PDF export coming in Step 11 — requires paid Supabase plan' }, { status: 501 })
}
