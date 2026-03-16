import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendNotification } from '@/lib/notifications/send'
import SupervisorCard from '@/components/supervision/SupervisorCard'

interface Props { params: { id: string } }

export default async function AssignSupervisorPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('research_projects')
    .select(`
      id, title, domain,
      profiles!research_projects_owner_id_fkey (id, full_name, email)
    `)
    .eq('id', params.id)
    .single()

  if (!project) notFound()

  const student = project.profiles as { id: string; full_name?: string; email: string } | null

  // Current assignments
  const { data: assignments } = await supabase
    .from('project_supervisors')
    .select(`
      id, supervisor_type, tagged_phases, tagged_sections, active,
      profiles!project_supervisors_supervisor_id_fkey (*)
    `)
    .eq('project_id', params.id)

  // Available supervisors
  const { data: allSupervisors } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['supervisor', 'teacher'])
    .order('available_slots', { ascending: false })

  // ── Server Actions ───────────────────────────────────────────────────────

  async function assignSupervisor(formData: FormData) {
    'use server'
    const supervisorId  = String(formData.get('supervisor_id'))
    const type          = String(formData.get('type')) as 'primary' | 'advisor'
    const phasesRaw     = String(formData.get('tagged_phases') ?? '')
    const sectionsRaw   = String(formData.get('tagged_sections') ?? '')

    const taggedPhases   = phasesRaw   ? phasesRaw.split(',').map(Number).filter(Boolean)    : []
    const taggedSections = sectionsRaw ? sectionsRaw.split(',').map(s => s.trim()).filter(Boolean) : []

    const supa = await createClient()
    await supa.from('project_supervisors').upsert(
      {
        project_id:      params.id,
        supervisor_id:   supervisorId,
        supervisor_type: type,
        tagged_phases:   taggedPhases,
        tagged_sections: taggedSections,
        assigned_by:     user.id,
        active:          true,
      },
      { onConflict: 'project_id,supervisor_id' }
    )

    // Decrement available_slots
    await supa.rpc('decrement_slots', { supervisor_id: supervisorId }).maybeSingle()

    // Notify supervisor
    await sendNotification('SUPERVISOR_ASSIGNED', supervisorId, {
      projectTitle: String((project as Record<string, unknown>).title ?? ''),
      studentName:  student?.full_name ?? student?.email ?? 'a student',
    })

    // Notify student
    if (student) {
      const { data: sup } = await supa.from('profiles').select('full_name').eq('id', supervisorId).single()
      await sendNotification('SUPERVISOR_ASSIGNED', student.id, {
        supervisorName: sup?.full_name ?? 'a supervisor',
        projectTitle:   String((project as Record<string, unknown>).title ?? ''),
      })
    }

    revalidatePath(`/coordinator/students/${params.id}/assign-supervisor`)
  }

  async function removeSupervisor(formData: FormData) {
    'use server'
    const assignmentId = String(formData.get('assignment_id'))
    const supa = await createClient()
    await supa.from('project_supervisors').update({ active: false }).eq('id', assignmentId)
    revalidatePath(`/coordinator/students/${params.id}/assign-supervisor`)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const activeAssignments = (assignments ?? []).filter(a => a.active)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-1">
          <a href="/coordinator/students" className="hover:underline">Students</a> →
        </p>
        <h1 className="text-xl font-bold text-gray-900">
          {String((project as Record<string, unknown>).title ?? 'Untitled')}
        </h1>
        <p className="text-sm text-gray-500">
          Student: {student?.full_name ?? student?.email ?? '—'}
          {(project as Record<string, unknown>).domain ? ` · ${(project as Record<string, unknown>).domain}` : ''}
        </p>
      </div>

      {/* Current supervisors */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Current Supervisors</h2>
        {activeAssignments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No supervisors assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {activeAssignments.map(a => {
              const sup = a.profiles as Record<string, unknown>
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="flex-1">
                    <SupervisorCard
                      supervisor={sup as Parameters<typeof SupervisorCard>[0]['supervisor']}
                      supervisorType={a.supervisor_type as 'primary' | 'advisor'}
                      taggedPhases={a.tagged_phases}
                      taggedSections={a.tagged_sections}
                    />
                  </div>
                  <form action={removeSupervisor}>
                    <input type="hidden" name="assignment_id" value={a.id} />
                    <button
                      type="submit"
                      className="mt-4 text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Assign new supervisor */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Assign Supervisor</h2>
        <form action={assignSupervisor} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supervisor <span className="text-red-500">*</span>
            </label>
            <select
              name="supervisor_id"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">— Select supervisor —</option>
              {(allSupervisors ?? []).map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name ?? s.email} ({s.available_slots} slots) — {s.expertise_domains.join(', ') || 'No domains listed'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex gap-4">
              {['primary', 'advisor'].map(t => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="type" value={t} defaultChecked={t === 'primary'} />
                  {t === 'primary' ? 'Primary Supervisor' : 'Domain Advisor'}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tagged Phases <span className="text-xs text-gray-400">(advisor only — comma-separated phase numbers)</span>
            </label>
            <input
              name="tagged_phases"
              placeholder="e.g. 1,2,3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tagged Sections <span className="text-xs text-gray-400">(advisor only — comma-separated section keys)</span>
            </label>
            <input
              name="tagged_sections"
              placeholder="e.g. methodology,results"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-sm font-medium text-white bg-christ-navy rounded-lg hover:bg-christ-navy/90"
          >
            Assign Supervisor
          </button>
        </form>
      </section>
    </div>
  )
}
