'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const progressUpdateSchema = z.object({
  project_id: z.string().uuid(),
  progress_percent: z.coerce.number().int().min(0).max(100),
  status: z.enum(['planning', 'in_progress', 'blocked', 'testing', 'completed']),
  summary: z.string().trim().min(5).max(300),
  accomplishments: z.string().trim().max(1500).optional(),
  blockers: z.string().trim().max(1500).optional(),
  next_steps: z.string().trim().max(1500).optional(),
})

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim()
  return text || null
}

function projectsUrl(kind: 'success' | 'error', message: string) {
  return `/student/projects?${new URLSearchParams({ [kind]: message }).toString()}`
}

export async function addProjectUpdateAction(formData: FormData) {
  const supabase = createClient()
  // The repository's checked-in Database type is a partial manual stub. Use
  // the runtime client until it is regenerated from the linked project.
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const parsed = progressUpdateSchema.safeParse({
    project_id: formData.get('project_id'),
    progress_percent: formData.get('progress_percent'),
    status: formData.get('status'),
    summary: formData.get('summary'),
    accomplishments: optionalText(formData.get('accomplishments')) ?? undefined,
    blockers: optionalText(formData.get('blockers')) ?? undefined,
    next_steps: optionalText(formData.get('next_steps')) ?? undefined,
  })

  if (!parsed.success) {
    redirect(projectsUrl('error', parsed.error.issues[0]?.message ?? 'Check the project update.'))
  }

  const values = parsed.data
  const { data: project } = await db
    .from('research_projects')
    .select('id, owner_id')
    .eq('id', values.project_id)
    .single()

  if (!project || project.owner_id !== user.id) {
    redirect(projectsUrl('error', 'You can update only your own project.'))
  }

  const { error } = await db.from('project_progress_updates').insert({
    project_id: values.project_id,
    author_id: user.id,
    progress_percent: values.progress_percent,
    status: values.status,
    summary: values.summary,
    accomplishments: values.accomplishments ?? null,
    blockers: values.blockers ?? null,
    next_steps: values.next_steps ?? null,
  })

  if (error) redirect(projectsUrl('error', error.message))

  // Keep existing project lists ordered by the most recent student activity.
  await db
    .from('research_projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', values.project_id)

  revalidatePath('/student/projects')
  revalidatePath('/teacher/inventory')
  redirect(projectsUrl('success', 'Your project progress was updated.'))
}
