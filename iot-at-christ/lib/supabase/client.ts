import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Browser client — anon key only, all queries are RLS-bound
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
