'use client'

import { toIST } from '@/lib/utils'

interface Reminder {
  id:      string
  status:  string
  created_at: string
  sessions: { title: string; scheduled_at: string } | null
}

export function ReminderHistory({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return <p className="text-sm font-body text-christ-navy/40">No reminder history yet.</p>
  }

  return (
    <div className="rounded-lg border border-christ-navy/10 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-christ-bg border-b border-christ-navy/10">
          <tr>
            <th className="px-5 py-3 text-left font-mono text-xs text-christ-navy/50">Session</th>
            <th className="px-5 py-3 text-left font-mono text-xs text-christ-navy/50">Scheduled</th>
            <th className="px-5 py-3 text-left font-mono text-xs text-christ-navy/50">Sent</th>
            <th className="px-5 py-3 text-left font-mono text-xs text-christ-navy/50">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-christ-navy/5">
          {reminders.map(r => (
            <tr key={r.id}>
              <td className="px-5 py-3 font-body text-christ-navy">{r.sessions?.title ?? '—'}</td>
              <td className="px-5 py-3 font-mono text-xs text-christ-navy/50">
                {r.sessions?.scheduled_at ? toIST(r.sessions.scheduled_at) : '—'}
              </td>
              <td className="px-5 py-3 font-mono text-xs text-christ-navy/50">{toIST(r.created_at)}</td>
              <td className="px-5 py-3">
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${r.status === 'sent' ? 'bg-christ-green/10 text-christ-green' : 'bg-christ-navy/10 text-christ-navy/50'}`}>
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
