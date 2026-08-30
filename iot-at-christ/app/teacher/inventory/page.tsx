import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  RotateCcw,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { availableQuantity, isLoanOverdue, outstandingQuantity } from '@/lib/inventory/stock'
import type {
  HardwareInventoryItem,
  HardwareLoan,
  ProjectProgressUpdate,
  ResearchProject,
} from '@/types/database'
import {
  addHardwareAction,
  issueHardwareAction,
  returnHardwareAction,
  updateLoanStatusAction,
} from './actions'

interface PageProps {
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>
}

interface StudentOption {
  id: string
  full_name: string | null
  email: string
}

interface LoanView extends HardwareLoan {
  inventory_item: Pick<HardwareInventoryItem, 'asset_code' | 'name'> | null
  borrower: StudentOption | null
  project: Pick<ResearchProject, 'id' | 'title'> | null
}

interface ProjectView extends Pick<ResearchProject, 'id' | 'title' | 'domain' | 'approval_status' | 'updated_at'> {
  owner_id: string | null
  owner: (StudentOption & { role: string }) | null
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'loans', label: 'Checkouts' },
  { id: 'projects', label: 'Student Projects' },
] as const

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' })

function formatDate(value: string | null) {
  if (!value) return 'No due date'
  return DATE_FORMATTER.format(new Date(value))
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ')
}

export default async function TeacherInventoryPage({ searchParams }: PageProps) {
  const query = await searchParams
  const supabase = createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'coordinator'].includes(profile.role)) redirect('/dashboard')

  const [inventoryResult, loansResult, studentsResult, projectsResult, updatesResult] = await Promise.all([
    db.from('hardware_inventory').select('*').order('name'),
    db.from('hardware_loans').select(`
      *,
      inventory_item:hardware_inventory!hardware_loans_inventory_item_id_fkey(asset_code, name),
      borrower:profiles!hardware_loans_borrower_id_fkey(id, full_name, email),
      project:research_projects!hardware_loans_project_id_fkey(id, title)
    `).order('issued_at', { ascending: false }),
    db.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name'),
    db.from('research_projects').select(`
      id, title, domain, approval_status, owner_id, updated_at,
      owner:profiles!research_projects_owner_id_fkey(id, full_name, email, role)
    `).order('updated_at', { ascending: false }),
    db.from('project_progress_updates').select('*').order('created_at', { ascending: false }),
  ])

  const inventory = (inventoryResult.data ?? []) as HardwareInventoryItem[]
  const loans = (loansResult.data ?? []) as unknown as LoanView[]
  const students = (studentsResult.data ?? []) as StudentOption[]
  const projects = ((projectsResult.data ?? []) as unknown as ProjectView[])
    .filter(project => project.owner?.role === 'student')
  const updates = (updatesResult.data ?? []) as ProjectProgressUpdate[]
  const outstandingLoans = loans.filter(loan => loan.status !== 'returned')
  const totalUnits = inventory.reduce((sum, item) => sum + item.total_quantity, 0)
  const unitsOut = outstandingLoans.reduce((sum, loan) => sum + outstandingQuantity(loan), 0)
  const availableUnits = Math.max(totalUnits - unitsOut, 0)
  const overdueLoans = outstandingLoans.filter(loan => isLoanOverdue(loan))
  const lowStock = inventory.filter(item => availableQuantity(item, loans) <= item.minimum_quantity)
  const activeTab = TABS.some(tab => tab.id === query.tab) ? query.tab! : 'overview'
  const latestUpdateByProject = new Map<string, ProjectProgressUpdate>()
  updates.forEach(update => {
    if (!latestUpdateByProject.has(update.project_id)) latestUpdateByProject.set(update.project_id, update)
  })

  const summaryCards = [
    { label: 'Total units', value: totalUnits, detail: `${inventory.length} hardware types`, icon: Boxes, tone: 'text-christ-blue bg-christ-blue/10' },
    { label: 'Available', value: availableUnits, detail: `${unitsOut} currently out`, icon: PackageCheck, tone: 'text-christ-green bg-christ-green/10' },
    { label: 'Active checkouts', value: outstandingLoans.length, detail: `${overdueLoans.length} overdue`, icon: ClipboardList, tone: 'text-christ-saffron bg-christ-saffron/10' },
    { label: 'Student projects', value: projects.length, detail: `${updates.length} progress updates`, icon: Users, tone: 'text-christ-navy bg-christ-navy/10' },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-christ-saffron">Lab operations</p>
          <h1 className="font-display text-3xl font-bold text-christ-navy">Inventory & Project Tracker</h1>
          <p className="mt-1 max-w-2xl text-sm text-christ-navy/60">
            Know what the lab owns, who is using it, when it is due, and how every student project is progressing.
          </p>
        </div>
        <Link href="/teacher/research" className="text-sm font-semibold text-christ-blue hover:underline">
          Open Research Lab →
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

      <nav className="flex gap-1 overflow-x-auto border-b border-christ-navy/10" aria-label="Inventory sections">
        {TABS.map(tab => (
          <Link
            key={tab.id}
            href={`/teacher/inventory?tab=${tab.id}`}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'border-christ-saffron text-christ-navy'
                : 'border-transparent text-christ-navy/50 hover:text-christ-navy'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(card => (
              <div key={card.label} className="rounded-2xl border border-christ-navy/10 bg-white p-5 shadow-sm">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold text-christ-navy">{card.value}</p>
                <p className="mt-1 text-sm font-semibold text-christ-navy">{card.label}</p>
                <p className="text-xs text-christ-navy/50">{card.detail}</p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-christ-navy/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-christ-navy">Needs attention</h2>
                <Link href="?tab=loans" className="text-xs font-semibold text-christ-blue hover:underline">View checkouts</Link>
              </div>
              {!overdueLoans.length && !lowStock.length ? (
                <p className="text-sm text-christ-navy/50">Everything looks healthy. No overdue or low-stock items.</p>
              ) : (
                <div className="space-y-3">
                  {overdueLoans.slice(0, 4).map(loan => (
                    <div key={loan.id} className="rounded-xl border border-red-100 bg-red-50 p-3">
                      <p className="text-sm font-semibold text-red-800">{loan.inventory_item?.name ?? 'Hardware'} is overdue</p>
                      <p className="text-xs text-red-700/70">{loan.borrower?.full_name ?? loan.borrower?.email} · due {formatDate(loan.due_at)}</p>
                    </div>
                  ))}
                  {lowStock.slice(0, 4).map(item => (
                    <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <p className="text-sm font-semibold text-amber-900">{item.name} is at its stock threshold</p>
                      <p className="text-xs text-amber-800/70">{availableQuantity(item, loans)} available · minimum {item.minimum_quantity}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-christ-navy/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-christ-navy">Latest project activity</h2>
                <Link href="?tab=projects" className="text-xs font-semibold text-christ-blue hover:underline">View projects</Link>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 5).map(project => {
                  const update = latestUpdateByProject.get(project.id)
                  return (
                    <div key={project.id} className="flex items-center gap-3 rounded-xl border border-christ-navy/5 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-christ-blue/10 text-sm font-bold text-christ-blue">
                        {update?.progress_percent ?? 0}%
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-christ-navy">{project.title ?? 'Untitled project'}</p>
                        <p className="truncate text-xs text-christ-navy/50">
                          {project.owner?.full_name ?? project.owner?.email} · {update?.summary ?? 'No progress update yet'}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {!projects.length && <p className="text-sm text-christ-navy/50">No student projects yet.</p>}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'hardware' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="overflow-hidden rounded-2xl border border-christ-navy/10 bg-white">
            <div className="border-b border-christ-navy/10 px-5 py-4">
              <h2 className="font-display text-lg font-bold text-christ-navy">Hardware catalogue</h2>
              <p className="text-xs text-christ-navy/50">Availability automatically accounts for all unresolved checkouts.</p>
            </div>
            <div className="divide-y divide-christ-navy/5">
              {inventory.map(item => {
                const available = availableQuantity(item, loans)
                const threshold = available <= item.minimum_quantity
                return (
                  <article key={item.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-christ-blue">{item.asset_code}</span>
                        <span className="rounded-full bg-christ-navy/5 px-2 py-0.5 text-xs text-christ-navy/60">{item.category}</span>
                        {threshold && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Low stock</span>}
                      </div>
                      <h3 className="mt-1 font-semibold text-christ-navy">{item.name}</h3>
                      <p className="text-xs text-christ-navy/50">
                        {[item.model, item.storage_location, statusLabel(item.condition)].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`text-2xl font-bold ${threshold ? 'text-amber-700' : 'text-christ-green'}`}>{available}</p>
                      <p className="text-xs text-christ-navy/50">available of {item.total_quantity}</p>
                    </div>
                  </article>
                )
              })}
              {!inventory.length && <p className="px-5 py-10 text-center text-sm text-christ-navy/50">Add the first lab item using the form.</p>}
            </div>
          </section>

          <section className="h-fit rounded-2xl border border-christ-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-christ-navy">Add hardware</h2>
            <p className="mb-4 text-xs text-christ-navy/50">Use one record for interchangeable units of the same model.</p>
            <form action={addHardwareAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-christ-navy">Asset code
                  <input name="asset_code" required placeholder="SEN-DHT11" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal outline-none focus:border-christ-blue" />
                </label>
                <label className="text-xs font-semibold text-christ-navy">Category
                  <input name="category" required placeholder="Sensor" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal outline-none focus:border-christ-blue" />
                </label>
              </div>
              <label className="block text-xs font-semibold text-christ-navy">Hardware name
                <input name="name" required placeholder="DHT11 Temperature Sensor" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal outline-none focus:border-christ-blue" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-christ-navy">Model
                  <input name="model" placeholder="DHT11" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal outline-none focus:border-christ-blue" />
                </label>
                <label className="text-xs font-semibold text-christ-navy">Storage location
                  <input name="storage_location" placeholder="Cabinet A / Box 2" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal outline-none focus:border-christ-blue" />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-christ-navy">Quantity
                  <input type="number" name="total_quantity" min="1" defaultValue="1" required className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-christ-navy">Low at
                  <input type="number" name="minimum_quantity" min="0" defaultValue="0" required className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-christ-navy">₹ / unit
                  <input type="number" name="unit_cost_inr" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
                </label>
              </div>
              <label className="block text-xs font-semibold text-christ-navy">Condition
                <select name="condition" defaultValue="usable" className="mt-1 w-full rounded-lg border border-christ-navy/20 bg-white px-3 py-2 text-sm font-normal">
                  <option value="usable">Usable</option>
                  <option value="needs_repair">Needs repair</option>
                  <option value="retired">Retired</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-christ-navy">Notes
                <textarea name="description" rows={2} placeholder="Specifications or handling notes" className="mt-1 w-full resize-none rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
              </label>
              <button type="submit" className="w-full rounded-lg bg-christ-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-christ-blue">Add to inventory</button>
            </form>
          </section>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="space-y-3">
            {loans.map(loan => {
              const remaining = outstandingQuantity(loan)
              const overdue = isLoanOverdue(loan)
              return (
                <article key={loan.id} className={`rounded-2xl border bg-white p-5 ${overdue ? 'border-red-200' : 'border-christ-navy/10'}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-christ-blue">{loan.inventory_item?.asset_code}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${overdue ? 'bg-red-100 text-red-700' : 'bg-christ-navy/5 text-christ-navy/60'}`}>
                          {overdue ? 'overdue' : statusLabel(loan.status)}
                        </span>
                      </div>
                      <h2 className="mt-1 font-semibold text-christ-navy">{loan.inventory_item?.name ?? 'Unknown hardware'}</h2>
                      <p className="text-sm text-christ-navy/60">{loan.borrower?.full_name ?? loan.borrower?.email ?? 'Unknown borrower'}</p>
                      <p className="mt-1 text-xs text-christ-navy/50">
                        {remaining} of {loan.quantity} outstanding · issued {formatDate(loan.issued_at)} · due {formatDate(loan.due_at)}
                      </p>
                      {loan.project && <p className="mt-1 text-xs font-semibold text-christ-blue">Project: {loan.project.title}</p>}
                      {loan.purpose && <p className="mt-2 text-sm text-christ-navy/70">{loan.purpose}</p>}
                    </div>

                    {loan.status !== 'returned' && (
                      <div className="flex w-full flex-col gap-2 lg:w-72">
                        <form action={returnHardwareAction} className="flex gap-2">
                          <input type="hidden" name="loan_id" value={loan.id} />
                          <input type="number" name="return_quantity" min="1" max={remaining} defaultValue={remaining} aria-label="Returned quantity" className="w-20 rounded-lg border border-christ-navy/20 px-2 py-1.5 text-sm" />
                          <input name="return_notes" placeholder="Return note" aria-label="Return note" className="min-w-0 flex-1 rounded-lg border border-christ-navy/20 px-2 py-1.5 text-sm" />
                          <button type="submit" title="Record return" className="rounded-lg bg-christ-green/10 px-3 text-christ-green hover:bg-christ-green/20">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </form>
                        <form action={updateLoanStatusAction} className="flex gap-2">
                          <input type="hidden" name="loan_id" value={loan.id} />
                          <select name="status" defaultValue={loan.status === 'partially_returned' ? 'active' : loan.status} className="min-w-0 flex-1 rounded-lg border border-christ-navy/20 bg-white px-2 py-1.5 text-sm">
                            <option value="active">Active</option>
                            <option value="overdue">Overdue</option>
                            <option value="lost">Lost</option>
                            <option value="damaged">Damaged</option>
                          </select>
                          <button type="submit" className="rounded-lg border border-christ-navy/20 px-3 py-1.5 text-xs font-semibold text-christ-navy hover:bg-christ-navy/5">Update</button>
                        </form>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
            {!loans.length && <div className="rounded-2xl border border-dashed border-christ-navy/20 p-10 text-center text-sm text-christ-navy/50">No hardware has been issued yet.</div>}
          </section>

          <section className="h-fit rounded-2xl border border-christ-navy/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-bold text-christ-navy">Issue hardware</h2>
            <p className="mb-4 text-xs text-christ-navy/50">Assign equipment to a student and optionally connect it to their project.</p>
            <form action={issueHardwareAction} className="space-y-3">
              <label className="block text-xs font-semibold text-christ-navy">Hardware
                <select name="inventory_item_id" required className="mt-1 w-full rounded-lg border border-christ-navy/20 bg-white px-3 py-2 text-sm font-normal">
                  <option value="">Select hardware</option>
                  {inventory.filter(item => availableQuantity(item, loans) > 0 && item.condition === 'usable').map(item => (
                    <option key={item.id} value={item.id}>{item.asset_code} — {item.name} ({availableQuantity(item, loans)} available)</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-christ-navy">Student
                <select name="borrower_id" required className="mt-1 w-full rounded-lg border border-christ-navy/20 bg-white px-3 py-2 text-sm font-normal">
                  <option value="">Select student</option>
                  {students.map(student => <option key={student.id} value={student.id}>{student.full_name ?? student.email}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-christ-navy">Project (optional)
                <select name="project_id" className="mt-1 w-full rounded-lg border border-christ-navy/20 bg-white px-3 py-2 text-sm font-normal">
                  <option value="">General class/lab use</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.owner?.full_name ?? project.owner?.email} — {project.title}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-christ-navy">Quantity
                  <input type="number" name="quantity" min="1" defaultValue="1" required className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-christ-navy">Due date
                  <input type="date" name="due_date" className="mt-1 w-full rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
                </label>
              </div>
              <label className="block text-xs font-semibold text-christ-navy">Purpose
                <textarea name="purpose" rows={2} placeholder="Experiment, assignment, or build goal" className="mt-1 w-full resize-none rounded-lg border border-christ-navy/20 px-3 py-2 text-sm font-normal" />
              </label>
              <button type="submit" className="w-full rounded-lg bg-christ-saffron px-4 py-2.5 text-sm font-bold text-white hover:bg-christ-navy">Issue hardware</button>
            </form>
          </section>
        </div>
      )}

      {activeTab === 'projects' && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map(project => {
            const latest = latestUpdateByProject.get(project.id)
            const projectLoans = outstandingLoans.filter(loan => loan.project_id === project.id)
            return (
              <article key={project.id} className="rounded-2xl border border-christ-navy/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-christ-blue">{project.owner?.full_name ?? project.owner?.email}</p>
                    <h2 className="truncate font-display text-lg font-bold text-christ-navy">{project.title ?? 'Untitled project'}</h2>
                    <p className="text-xs text-christ-navy/50">{project.domain ?? 'IoT'} · {statusLabel(project.approval_status)}</p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-christ-green/10 text-sm font-bold text-christ-green">
                    {latest?.progress_percent ?? 0}%
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-christ-navy/10">
                  <div className="h-full rounded-full bg-christ-green" style={{ width: `${latest?.progress_percent ?? 0}%` }} />
                </div>
                <div className="mt-4 rounded-xl bg-christ-bg p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-christ-navy/40">Latest update</p>
                  <p className="mt-1 text-sm font-semibold text-christ-navy">{latest?.summary ?? 'Student has not posted an update yet.'}</p>
                  {latest && <p className="mt-1 text-xs text-christ-navy/50">{statusLabel(latest.status)} · {formatDate(latest.created_at)}</p>}
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-christ-navy/40">Allocated hardware</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {projectLoans.map(loan => (
                      <span key={loan.id} className="rounded-full border border-christ-blue/20 bg-christ-blue/5 px-2.5 py-1 text-xs text-christ-blue">
                        {loan.inventory_item?.name} × {outstandingQuantity(loan)}
                      </span>
                    ))}
                    {!projectLoans.length && <span className="text-xs text-christ-navy/40">No hardware allocated</span>}
                  </div>
                </div>
                <Link href={`/teacher/research/${project.id}`} className="mt-5 inline-block text-sm font-semibold text-christ-blue hover:underline">
                  Open project details →
                </Link>
              </article>
            )
          })}
          {!projects.length && <div className="rounded-2xl border border-dashed border-christ-navy/20 p-10 text-center text-sm text-christ-navy/50">Student projects will appear here after they create them in the Research Lab.</div>}
        </section>
      )}
    </div>
  )
}
