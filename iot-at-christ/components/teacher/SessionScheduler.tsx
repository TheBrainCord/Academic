'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toIST } from '@/lib/utils'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

interface Props {
  sessionId:         string
  currentScheduledAt: string | null
}

export function SessionScheduler({ sessionId, currentScheduledAt }: Props) {
  const supabase = createClient()
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  // Keep the datetime-local input in IST so the teacher always sees and sets IST times
  const [value, setValue] = useState(
    currentScheduledAt
      ? formatInTimeZone(new Date(currentScheduledAt), IST, "yyyy-MM-dd'T'HH:mm")
      : ''
  )

  async function handleSave() {
    if (!value) return
    setSaving(true)
    // value is an IST datetime string — convert to UTC before storing
    const utc = fromZonedTime(value, IST).toISOString()
    await supabase.from('sessions').update({ scheduled_at: utc }).eq('id', sessionId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section>
      <h2 className="text-lg font-display font-semibold text-christ-navy mb-3">Schedule</h2>
      {currentScheduledAt && (
        <p className="text-xs font-mono text-christ-navy/50 mb-2">
          Currently: {toIST(currentScheduledAt)} IST
        </p>
      )}
      <div className="flex items-center gap-3">
        <input
          type="datetime-local"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="rounded border border-christ-navy/20 px-3 py-2 text-sm font-mono text-christ-navy bg-white"
        />
        <button
          onClick={handleSave}
          disabled={saving || !value}
          className="px-4 py-2 rounded bg-christ-navy text-white text-sm font-mono hover:bg-christ-saffron transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Set Schedule'}
        </button>
      </div>
    </section>
  )
}
