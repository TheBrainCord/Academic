import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Post-login router: reads role from DB and dispatches to the right sub-tree
export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') redirect('/teacher/dashboard')
  redirect('/student/dashboard')
}
