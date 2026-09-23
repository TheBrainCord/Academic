import type { HardwareInventoryItem, HardwareLoan, HardwareLoanStatus } from '@/types/database'

const OUTSTANDING_STATUSES = new Set<HardwareLoanStatus>([
  'active',
  'partially_returned',
  'overdue',
  'lost',
  'damaged',
])

export function isOutstandingStatus(status: HardwareLoanStatus): boolean {
  return OUTSTANDING_STATUSES.has(status)
}

export function outstandingQuantity(
  loan: Pick<HardwareLoan, 'quantity' | 'returned_quantity' | 'status'>
): number {
  if (!isOutstandingStatus(loan.status)) return 0
  return Math.max(loan.quantity - loan.returned_quantity, 0)
}

export function availableQuantity(
  item: Pick<HardwareInventoryItem, 'id' | 'total_quantity'>,
  loans: Array<Pick<HardwareLoan, 'inventory_item_id' | 'quantity' | 'returned_quantity' | 'status'>>
): number {
  const checkedOut = loans
    .filter(loan => loan.inventory_item_id === item.id)
    .reduce((sum, loan) => sum + outstandingQuantity(loan), 0)

  return Math.max(item.total_quantity - checkedOut, 0)
}

export function isLoanOverdue(
  loan: Pick<HardwareLoan, 'due_at' | 'quantity' | 'returned_quantity' | 'status'>,
  now = new Date()
): boolean {
  if (!loan.due_at || outstandingQuantity(loan) === 0) return false
  return new Date(loan.due_at).getTime() < now.getTime()
}
