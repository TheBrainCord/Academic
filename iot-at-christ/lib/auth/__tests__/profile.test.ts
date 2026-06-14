import { describe, it, expect } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { buildProfileUpsert } from '../profile'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'student@christuniversity.in',
    user_metadata: {
      full_name: 'Test Student',
      avatar_url: 'https://example.com/avatar.png',
    },
    identities: [
      { provider: 'google', id: 'google-456' } as User['identities'][number],
    ],
    ...overrides,
  } as User
}

describe('buildProfileUpsert', () => {
  it('maps the Google identity and metadata onto profile columns', () => {
    expect(buildProfileUpsert(makeUser())).toEqual({
      id: 'user-123',
      email: 'student@christuniversity.in',
      full_name: 'Test Student',
      avatar_url: 'https://example.com/avatar.png',
      google_id: 'google-456',
    })
  })

  it('falls back to null names/avatars when metadata is missing', () => {
    const user = makeUser({ user_metadata: {} })
    const result = buildProfileUpsert(user)
    expect(result.full_name).toBeNull()
    expect(result.avatar_url).toBeNull()
  })

  it('leaves google_id undefined when there is no google identity', () => {
    const user = makeUser({ identities: [] })
    expect(buildProfileUpsert(user).google_id).toBeUndefined()
  })
})
