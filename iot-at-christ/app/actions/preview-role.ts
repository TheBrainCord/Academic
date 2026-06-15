'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { canTogglePreviewRole, dashboardForRole, togglePreviewRole } from '@/lib/auth/access'

/**
 * Lets the admin account flip their own profile between 'teacher' and
 * 'student' to preview the student portal. The profiles_role_change_guard
 * trigger (migration 004) restricts this update to the admin's row.
 */
export async function togglePreviewRoleAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !canTogglePreviewRole(user.email)) {
    redirect('/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const newRole = togglePreviewRole(profile?.role)

  await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', user.id)

  redirect(dashboardForRole(newRole))
}
