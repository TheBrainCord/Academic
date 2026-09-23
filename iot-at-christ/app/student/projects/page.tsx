import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, CheckCircle2, CircuitBoard, Clock3, PackageOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isLoanOverdue, outstandingQuantity } from '@/lib/inventory/stock'
import type { HardwareInventoryItem, HardwareLoan, ProjectProgressUpdate } from '@/types/database'
import { addProjectUpdateAction } from './actions'

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>
}

interface StudentLoanView extends HardwareLoan {
  inventory_item: Pick<HardwareInventoryItem, 'asset_code' | 'name' | 'category'> | null
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })

function formatDate(value: string | null) {
  if (!value) return 'No due date'
  return DATE_FORMATTER.format(new Date(value))
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ')
}

export default async function StudentProjectsPage({ searchParams }: PageProps) {
  const query = await searchParams
  const supabase = createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: project }, loansResult] = await Promise.all([
    db.from('research_projects')
      .select('id, title, domain, abstract, approval_status, teacher_feedback, updated_at')
      .eq('owner_id', user.id)
      .maybeSingle(),
    db.from('hardware_loans')
      .select(`
        *,
        inventory_item:hardware_inventory!hardware_loans_inventory_item_id_fkey(asset_code, name, category)
      `)
      .eq('borrower_id', user.id)
      .order('issued_at', { ascending: false }),
  ])

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-christ-blue/10 text-christ-blue">
          <CircuitBoard className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-christ-navy">Start your IoT project</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-christ-navy/60">
          Choose an idea in the Research Lab first. Once your project exists, this page will track progress and every hardware item issued to you.
        </p>
        <Link href="/student/research" className="mt-6 inline-flex rounded-lg bg-christ-saffron px-5 py-2.5 text-sm font-bold text-white hover:bg-christ-navy">
          Explore project ideas
        </Link>
      </div>
    )
  }

  const [{ data: updatesData }] = await Promise.all([
    db.from('project_progress_updates')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false }),
  ])

  const updates = (updatesData ?? []) as ProjectProgressUpdate[]
  const loans = (loansResult.data ?? []) as unknown as StudentLoanView[]
  const projectLoans = loans.filter(loan => loan.project_id === project.id && loan.status !== 'returned')
  const generalLoans = loans.filter(loan => !loan.project_id && loan.status !== 'returned')
  const latest = updates[0]

  return (
    <div className="space-y-7">
      <header className="rounded-2xl bg-research-bg p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-research-amber">My IoT project</p>
            <h1 className="mt-1 font-display text-2xl font-bold">{project.title ?? 'Untitled project'}</h1>
            <p className="mt-1 text-sm text-white/60">{project.domain ?? 'IoT'} · {statusLabel(project.approval_status)}</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-research-amber/30 bg-white/10 text-lg font-bold text-research-amber">
            {latest?.progress_percent ?? 0}%
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-research-amber transition-all" style={{ width: `${latest?.progress_percent ?? 0}%` }} />
        </div>
        <Link href={`/student/research/${project.id}`} className="mt-4 inline-block text-sm font-semibold text-research-amber hover:underline">
          Open research workspace →
        </Link>
      </header>

      {query.success && (
        <div className="flex items-center gap-2 rounded-xl border border-christ-green/20 bg-christ-green/5 px-4 py-3 text-sm text-christ-green">
          <CheckCircle2 className="h-4 w-4" /> {query.success}
        </div>
      )}
      {query.error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {query.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-christ-navy/10 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-christ-navy">Hardware assigned to this project</h2>
                <p className="text-xs text-christ-navy/50">Return items to your teacher; the inventory record updates immediately.</p>
              </div>
              <PackageOpen className="h-5 w-5 text-christ-blue" />
            </div>
            <div className="space-y-3">
              {projectLoans.map(loan => {
                const overdue = isLoanOverdue(loan)
                return (
                  <article key={loan.id} className={`rounded-xl border p-4 ${overdue ? 'border-red-200 bg-red-50' : 'border-christ-navy/10 bg-christ-bg'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-bold text-christ-blue">{loan.inventory_item?.asset_code}</p>
                        <h3 className="text-sm font-semibold text-christ-navy">{loan.inventory_item?.name ?? 'Hardware'}</h3>
                        <p className="text-xs text-christ-navy/50">{outstandingQuantity(loan)} unit(s) with you · {loan.inventory_item?.category}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${overdue ? 'bg-red-100 text-red-700' : 'bg-white text-christ-navy/60'}`}>
                        {overdue ? 'overdue' : statusLabel(loan.status)}
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-1 text-xs text-christ-navy/50"><Clock3 className="h-3.5 w-3.5" /> Due {formatDate(loan.due_at)}</p>
                  </article>
                )
              })}
              {!projectLoans.length && <p className="rounded-xl border border-dashed border-christ-navy/20 p-6 text-center text-sm text-christ-navy/50">No hardware is linked to this project yet.</p>}
            </div>
            {generalLoans.length > 0 && (
              <div className="mt-4 border-t border-christ-navy/10 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-christ-navy/40">Other hardware with you</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {generalLoans.map(loan => (
                    <span key={loan.id} className="rounded-full bg-christ-blue/5 px-2.5 py-1 text-xs text-christ-blue">
                      {loan.inventory_item?.name} × {outstandingQuantity(loan)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-christ-navy/10 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-christ-navy">Progress timeline</h2>
            <div className="mt-5 space-y-0">
              {updates.map((update, index) => (
                <article key={update.id} className="relative grid grid-cols-[2.5rem_1fr] gap-3 pb-6">
                  {index < updates.length - 1 && <div className="absolute bottom-0 left-5 top-10 w-px bg-christ-navy/10" />}
                  <div className="z-[1] flex h-10 w-10 items-center justify-center rounded-full bg-christ-blue text-xs font-bold text-white">{update.progress_percent}%</div>
                  <div className="rounded-xl border border-christ-navy/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-christ-navy">{update.summary}</p>
                      <span className="rounded-full bg-christ-navy/5 px-2 py-0.5 text-xs text-christ-navy/60">{statusLabel(update.status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-christ-navy/40">{formatDate(update.created_at)}</p>
                    {update.accomplishments && <p className="mt-3 text-sm text-christ-navy/70"><strong>Completed:</strong> {update.accomplishments}</p>}
                    {update.blockers && <p className="mt-2 text-sm text-red-700"><strong>Blockers:</strong> {update.blockers}</p>}
                    {update.next_steps && <p className="mt-2 text-sm text-christ-blue"><strong>Next:</strong> {update.next_steps}</p>}
                  </div>
                </article>
              ))}
              {!updates.length && <p className="rounded-xl border border-dashed border-christ-navy/20 p-8 text-center text-sm text-christ-navy/50">Post your first update to start the project timeline.</p>}
            </div>
          </section>
        </div>

        <section className="h-fit rounded-2xl border border-christ-navy/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-bold text-christ-navy">Post progress update</h2>
          <p className="mb-4 text-xs text-christ-navy/50">Record evidence of work, blockers, and what you will do next.</p>
          <form action={addProjectUpdateAction} className="space-y-3">
            <input type="hidden" name="project_id" value={project.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-christ-navy">Progress %
                <input type="number" name="progress_percent" min="0" max="100" defaultValue={latest?.progress_percent ?? 0} required className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="text-xs font-semibold text-christ-navy">Status
                <select name="status" defaultValue={latest?.status ?? 'in_progress'} className="mt-1 w-full rounded-lg border border-christ-navy/20 bg-white px-3 py-2 text-sm font-normal">
                  <option value="planning">Planning</option>
                  <option value="in_progress">In progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
            </div>
            <label className="block text-xs font-semibold text-christ-navy">Update summary
              <input name="summary" required minLength={5} placeholder="Built and tested sensor circuit" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="block text-xs font-semibold text-christ-navy">What did you complete?
              <textarea name="accomplishments" rows={3} placeholder="Evidence, readings, code, or test result" className="mt-1 w-full resize-none rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="block text-xs font-semibold text-christ-navy">Any blockers?
              <textarea name="blockers" rows={2} placeholder="Hardware, code, data, or guidance needed" className="mt-1 w-full resize-none rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
            </label>
            <label className="block text-xs font-semibold text-christ-navy">Next steps
              <textarea name="next_steps" rows={2} placeholder="What will you do before the next update?" className="mt-1 w-full resize-none rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
            </label>
            <button type="submit" className="w-full rounded-lg bg-christ-saffron px-4 py-2.5 text-sm font-bold text-white hover:bg-christ-navy">Post update</button>
          </form>
        </section>
      </div>
    </div>
  )
}
