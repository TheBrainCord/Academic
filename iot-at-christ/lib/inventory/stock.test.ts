import { describe, expect, it } from 'vitest'
import { availableQuantity, isLoanOverdue, outstandingQuantity } from './stock'

describe('inventory stock calculations', () => {
  it('subtracts active and partially returned quantities from stock', () => {
    const loans = [
      { inventory_item_id: 'esp32', quantity: 4, returned_quantity: 1, status: 'partially_returned' as const },
      { inventory_item_id: 'esp32', quantity: 2, returned_quantity: 2, status: 'returned' as const },
      { inventory_item_id: 'other', quantity: 10, returned_quantity: 0, status: 'active' as const },
    ]

    expect(availableQuantity({ id: 'esp32', total_quantity: 8 }, loans)).toBe(5)
  })

  it('keeps lost and damaged units unavailable until resolved', () => {
    expect(outstandingQuantity({ quantity: 2, returned_quantity: 0, status: 'lost' })).toBe(2)
    expect(outstandingQuantity({ quantity: 3, returned_quantity: 1, status: 'damaged' })).toBe(2)
  })

  it('flags only outstanding loans past their due date', () => {
    const now = new Date('2026-08-29T12:00:00.000Z')

    expect(isLoanOverdue({
      due_at: '2026-08-28T12:00:00.000Z', quantity: 1, returned_quantity: 0, status: 'active',
    }, now)).toBe(true)

    expect(isLoanOverdue({
      due_at: '2026-08-28T12:00:00.000Z', quantity: 1, returned_quantity: 1, status: 'returned',
    }, now)).toBe(false)
  })
})
