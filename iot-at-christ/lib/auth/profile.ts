import type { User } from '@supabase/supabase-js'
import type { UserRole } from './access'

/** Shape of the row upserted into `profiles` on first sign-in. */
export interface ProfileUpsert {
  id: string
  email: string | undefined
  full_name: string | null
  avatar_url: string | null
  google_id: string | undefined
  role?: UserRole
}

/**
 * Build the `profiles` upsert payload from a freshly-authenticated Supabase
 * user. Pulled out of the OAuth callback route so the mapping from Google's
 * identity/user_metadata shape to our profile columns can be unit tested
 * without a live Supabase exchange.
 *
 * `role` should only be passed for brand-new profiles — returning users keep
 * whatever role they were assigned (e.g. by a teacher), so it must not be
 * overwritten on every login.
 */
export function buildProfileUpsert(user: User, role?: UserRole): ProfileUpsert {
  const googleIdentity = user.identities?.find(i => i.provider === 'google')

  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    google_id: googleIdentity?.id,
    ...(role ? { role } : {}),
  }
}
