'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { HardwareLoanStatus } from '@/types/database'

const inventoryItemSchema = z.object({
  asset_code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60),
  model: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  storage_location: z.string().trim().max(120).optional(),
  total_quantity: z.coerce.number().int().min(1).max(10000),
  minimum_quantity: z.coerce.number().int().min(0).max(10000),
  unit_cost_inr: z.union([z.literal(''), z.coerce.number().min(0).max(10000000)]),
  condition: z.enum(['usable', 'needs_repair', 'retired']),
})

const issueHardwareSchema = z.object({
  inventory_item_id: z.string().uuid(),
  borrower_id: z.string().uuid(),
  project_id: z.union([z.literal(''), z.string().uuid()]),
  quantity: z.coerce.number().int().min(1).max(10000),
  due_date: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid due date.')]),
  purpose: z.string().trim().max(500).optional(),
})

const returnHardwareSchema = z.object({
  loan_id: z.string().uuid(),
  return_quantity: z.coerce.number().int().min(1).max(10000),
  return_notes: z.string().trim().max(500).optional(),
})

const loanStatusSchema = z.object({
  loan_id: z.string().uuid(),
  status: z.enum(['active', 'overdue', 'lost', 'damaged']),
})

function optionalText(value: FormDataEntryValue | null): string | undefined {
  const text = String(value ?? '').trim()
  return text || undefined
}

function inventoryUrl(kind: 'success' | 'error', message: string, tab = 'hardware') {
  const query = new URLSearchParams({ tab, [kind]: message })
  return `/teacher/inventory?${query.toString()}`
}

async function requireInventoryManager() {
  const supabase = createClient()
  // The repository's checked-in Database type is a partial manual stub. Use
  // the runtime client until it is regenerated from the linked project.
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'coordinator'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return { supabase: db, user }
}

export async function addHardwareAction(formData: FormData) {
  const { supabase, user } = await requireInventoryManager()
  const parsed = inventoryItemSchema.safeParse({
    asset_code: formData.get('asset_code'),
    name: formData.get('name'),
    category: formData.get('category'),
    model: optionalText(formData.get('model')),
    description: optionalText(formData.get('description')),
    storage_location: optionalText(formData.get('storage_location')),
    total_quantity: formData.get('total_quantity'),
    minimum_quantity: formData.get('minimum_quantity'),
    unit_cost_inr: formData.get('unit_cost_inr') ?? '',
    condition: formData.get('condition'),
  })

  if (!parsed.success) {
    redirect(inventoryUrl('error', parsed.error.issues[0]?.message ?? 'Check the hardware details.'))
  }

  const values = parsed.data
  const { error } = await supabase.from('hardware_inventory').insert({
    ...values,
    asset_code: values.asset_code.toUpperCase(),
    model: values.model ?? null,
    description: values.description ?? null,
    storage_location: values.storage_location ?? null,
    unit_cost_inr: values.unit_cost_inr === '' ? null : values.unit_cost_inr,
    created_by: user.id,
  })

  if (error) {
    const message = error.code === '23505' ? 'That asset code is already in use.' : error.message
    redirect(inventoryUrl('error', message))
  }

  revalidatePath('/teacher/inventory')
  redirect(inventoryUrl('success', `${values.name} was added to inventory.`))
}

export async function issueHardwareAction(formData: FormData) {
  const { supabase, user } = await requireInventoryManager()
  const parsed = issueHardwareSchema.safeParse({
    inventory_item_id: formData.get('inventory_item_id'),
    borrower_id: formData.get('borrower_id'),
    project_id: formData.get('project_id') ?? '',
    quantity: formData.get('quantity'),
    due_date: formData.get('due_date') ?? '',
    purpose: optionalText(formData.get('purpose')),
  })

  if (!parsed.success) {
    redirect(inventoryUrl('error', parsed.error.issues[0]?.message ?? 'Check the checkout details.', 'loans'))
  }

  const values = parsed.data
  const { data: borrower } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', values.borrower_id)
    .single()

  if (!borrower || borrower.role !== 'student') {
    redirect(inventoryUrl('error', 'Select a valid student borrower.', 'loans'))
  }

  if (values.project_id) {
    const { data: project } = await supabase
      .from('research_projects')
      .select('owner_id')
      .eq('id', values.project_id)
      .single()

    if (!project || project.owner_id !== values.borrower_id) {
      redirect(inventoryUrl('error', 'The selected project does not belong to this student.', 'loans'))
    }
  }

  const { error } = await supabase.from('hardware_loans').insert({
    inventory_item_id: values.inventory_item_id,
    borrower_id: values.borrower_id,
    project_id: values.project_id || null,
    issued_by: user.id,
    quantity: values.quantity,
    purpose: values.purpose ?? null,
    // The course operates in India; a date means end-of-day IST.
    due_at: values.due_date
      ? new Date(`${values.due_date}T23:59:59+05:30`).toISOString()
      : null,
    status: 'active',
  })

  if (error) {
    redirect(inventoryUrl('error', error.message, 'loans'))
  }

  revalidatePath('/teacher/inventory')
  revalidatePath('/student/projects')
  redirect(inventoryUrl('success', `Hardware issued to ${borrower.full_name ?? 'student'}.`, 'loans'))
}

export async function returnHardwareAction(formData: FormData) {
  const { supabase } = await requireInventoryManager()
  const parsed = returnHardwareSchema.safeParse({
    loan_id: formData.get('loan_id'),
    return_quantity: formData.get('return_quantity'),
    return_notes: optionalText(formData.get('return_notes')),
  })

  if (!parsed.success) {
    redirect(inventoryUrl('error', parsed.error.issues[0]?.message ?? 'Check the returned quantity.', 'loans'))
  }

  const values = parsed.data
  const { data: loan } = await supabase
    .from('hardware_loans')
    .select('quantity, returned_quantity')
    .eq('id', values.loan_id)
    .single()

  if (!loan) redirect(inventoryUrl('error', 'Checkout record not found.', 'loans'))

  const outstanding = loan.quantity - loan.returned_quantity
  if (values.return_quantity > outstanding) {
    redirect(inventoryUrl('error', `Only ${outstanding} unit(s) are still outstanding.`, 'loans'))
  }

  const returnedQuantity = loan.returned_quantity + values.return_quantity
  const fullyReturned = returnedQuantity === loan.quantity
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('hardware_loans')
    .update({
      returned_quantity: returnedQuantity,
      status: fullyReturned ? 'returned' : 'partially_returned',
      returned_at: fullyReturned ? now : null,
      return_notes: values.return_notes ?? null,
      updated_at: now,
    })
    .eq('id', values.loan_id)

  if (error) redirect(inventoryUrl('error', error.message, 'loans'))

  revalidatePath('/teacher/inventory')
  revalidatePath('/student/projects')
  redirect(inventoryUrl('success', fullyReturned ? 'Checkout closed as returned.' : 'Partial return recorded.', 'loans'))
}

export async function updateLoanStatusAction(formData: FormData) {
  const { supabase } = await requireInventoryManager()
  const parsed = loanStatusSchema.safeParse({
    loan_id: formData.get('loan_id'),
    status: formData.get('status'),
  })

  if (!parsed.success) redirect(inventoryUrl('error', 'Select a valid checkout status.', 'loans'))

  const values = parsed.data
  const { error } = await supabase
    .from('hardware_loans')
    .update({ status: values.status as HardwareLoanStatus, updated_at: new Date().toISOString() })
    .eq('id', values.loan_id)

  if (error) redirect(inventoryUrl('error', error.message, 'loans'))

  revalidatePath('/teacher/inventory')
  revalidatePath('/student/projects')
  redirect(inventoryUrl('success', 'Checkout status updated.', 'loans'))
}
