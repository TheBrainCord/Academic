import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ClassroomSyncStatus } from '@/components/teacher/ClassroomSyncStatus'

export default async function TeacherStudentsPage() {
  const supabase = createClient()

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, created_at')
    .eq('role', 'student')
    .order('full_name')

  const { data: lastSync } = await supabase
    .from('sync_log')
    .select('created_at, student_count, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-christ-navy">Students</h1>
        <ClassroomSyncStatus lastSync={lastSync} />
      </div>

      <div className="rounded-lg border border-christ-navy/10 bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-christ-bg border-b border-christ-navy/10">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left font-mono text-xs text-christ-navy/50">Name</th>
              <th className="hidden sm:table-cell px-6 py-3 text-left font-mono text-xs text-christ-navy/50">Email</th>
              <th className="px-4 sm:px-6 py-3 text-left font-mono text-xs text-christ-navy/50">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-christ-navy/5">
            {students?.map(s => (
              <tr key={s.id} className="hover:bg-christ-bg transition-colors">
                <td className="px-4 sm:px-6 py-3">
                  <Link href={`/teacher/students/${s.id}`} className="font-body text-christ-navy hover:text-christ-saffron">
                    {s.full_name}
                  </Link>
                </td>
                <td className="hidden sm:table-cell px-6 py-3 font-mono text-xs text-christ-navy/60">{s.email}</td>
                <td className="px-4 sm:px-6 py-3 font-mono text-xs text-christ-navy/40">
                  {new Date(s.created_at).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
