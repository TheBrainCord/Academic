import type { User } from '@supabase/supabase-js'

/** Shape of the row upserted into `profiles` on first sign-in. */
export interface ProfileUpsert {
  id: string
  email: string | undefined
  full_name: string | null
  avatar_url: string | null
  google_id: string | undefined
}

/**
 * Build the `profiles` upsert payload from a freshly-authenticated Supabase
 * user. Pulled out of the OAuth callback route so the mapping from Google's
 * identity/user_metadata shape to our profile columns can be unit tested
 * without a live Supabase exchange.
 */
export function buildProfileUpsert(user: User): ProfileUpsert {
  const googleIdentity = user.identities?.find(i => i.provider === 'google')

  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    google_id: googleIdentity?.id,
  }
}
