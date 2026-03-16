'use client'

import { useState } from 'react'

interface Props {
  lastSync: { created_at: string; student_count: number; status: string } | null
}

export function ClassroomSyncStatus({ lastSync }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult]   = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setResult(null)
    try {
      const res  = await fetch('/api/classroom/sync', { method: 'POST' })
      const data = await res.json()
      setResult(res.ok ? `Synced ${data.synced} students` : data.error)
    } catch {
      setResult('Sync failed — check console')
    } finally {
      setSyncing(false)
    }
  }

  const lastSyncText = lastSync
    ? `Last synced ${Math.round((Date.now() - new Date(lastSync.created_at).getTime()) / 60000)}m ago (${lastSync.student_count} students)`
    : 'Never synced'

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-christ-navy/40">{lastSyncText}</span>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-3 py-1.5 rounded border border-christ-navy/20 text-xs font-mono text-christ-navy hover:bg-christ-bg transition-colors disabled:opacity-50"
      >
        {syncing ? 'Syncing…' : 'Sync with Classroom'}
      </button>
      {result && (
        <span className={`text-xs font-mono ${result.startsWith('Synced') ? 'text-christ-green' : 'text-christ-red'}`}>
          {result}
        </span>
      )}
    </div>
  )
}
