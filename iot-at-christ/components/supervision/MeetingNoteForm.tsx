'use client'

import { useState } from 'react'

interface ActionItem {
  item:      string
  owner:     string
  due_date:  string
}

interface Props {
  projectId:    string
  studentId:    string
  supervisorId: string
  onSave: (data: {
    scheduled_at: string
    agenda:       string
    notes:        string
    action_items: ActionItem[]
  }) => Promise<void>
}

export default function MeetingNoteForm({ onSave }: Props) {
  const [scheduledAt,  setScheduledAt]  = useState('')
  const [agenda,       setAgenda]       = useState('')
  const [notes,        setNotes]        = useState('')
  const [actionItems,  setActionItems]  = useState<ActionItem[]>([{ item: '', owner: '', due_date: '' }])
  const [loading,      setLoading]      = useState(false)

  function addActionItem() {
    setActionItems(prev => [...prev, { item: '', owner: '', due_date: '' }])
  }

  function removeActionItem(idx: number) {
    setActionItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateActionItem(idx: number, field: keyof ActionItem, value: string) {
    setActionItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave({
        scheduled_at: scheduledAt,
        agenda,
        notes,
        action_items: actionItems.filter(a => a.item.trim()),
      })
      setScheduledAt('')
      setAgenda('')
      setNotes('')
      setActionItems([{ item: '', owner: '', due_date: '' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900">Log Meeting</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time <span className="text-red-500">*</span></label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Agenda</label>
        <textarea
          value={agenda}
          onChange={e => setAgenda(e.target.value)}
          rows={2}
          placeholder="Topics discussed…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Meeting notes and decisions…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none"
        />
      </div>

      {/* Action items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Action Items</label>
        <div className="space-y-2">
          {actionItems.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <input
                placeholder="Action"
                value={item.item}
                onChange={e => updateActionItem(idx, 'item', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-christ-navy"
              />
              <input
                placeholder="Owner"
                value={item.owner}
                onChange={e => updateActionItem(idx, 'owner', e.target.value)}
                className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-christ-navy"
              />
              <input
                type="date"
                value={item.due_date}
                onChange={e => updateActionItem(idx, 'due_date', e.target.value)}
                className="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-christ-navy"
              />
              {actionItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeActionItem(idx)}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addActionItem}
          className="mt-2 text-sm text-christ-navy hover:underline"
        >
          + Add item
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || !scheduledAt}
        className="w-full py-2 text-sm font-medium text-white bg-christ-navy rounded-lg hover:bg-christ-navy/90 disabled:opacity-60"
      >
        {loading ? 'Saving…' : 'Save Meeting Notes'}
      </button>
    </form>
  )
}
