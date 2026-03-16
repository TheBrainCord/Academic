// Auto-generated Supabase types — regenerate with:
// npx supabase gen types typescript --project-id <id> > types/database.ts
//
// This is a manual stub. Run the command above once Supabase project is linked.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                    string
          email:                 string
          full_name:             string | null
          avatar_url:            string | null
          role:                  'teacher' | 'student'
          google_id:             string | null
          google_access_token:   string | null
          google_refresh_token:  string | null
          created_at:            string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      subjects: {
        Row: {
          id:          string
          slug:        string
          name:        string
          description: string | null
          year:        string | null
          semester:    string | null
          is_active:   boolean
          config:      Json | null
        }
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>
      }
      // Remaining tables omitted — run gen types to get full types
    }
    Views:    Record<string, never>
    Functions: Record<string, never>
    Enums:    Record<string, never>
  }
}
