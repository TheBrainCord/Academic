// Auto-generated Supabase types — regenerate with:
// npx supabase gen types typescript --project-id <id> > types/database.ts
//
// This is a manual stub. Run the command above once Supabase project is linked.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

// ─── Domain enums ───────────────────────────────────────────────────────────

export type UserRole        = 'teacher' | 'student' | 'coordinator' | 'supervisor'
export type RoleSubtype     = 'primary' | 'advisor' | null
export type PhaseStatus     = 'planned' | 'in-progress' | 'pending_review' | 'completed'
export type SignoffDecision = 'approved' | 'revision_requested' | 'coordinator_override'
export type SupervisorType  = 'primary' | 'advisor'
export type HardwareCondition = 'usable' | 'needs_repair' | 'retired'
export type HardwareLoanStatus =
  | 'active'
  | 'partially_returned'
  | 'returned'
  | 'overdue'
  | 'lost'
  | 'damaged'
export type ProjectProgressStatus = 'planning' | 'in_progress' | 'blocked' | 'testing' | 'completed'
export type NotificationType =
  | 'SUPERVISOR_ASSIGNED'
  | 'PHASE_SUBMITTED'
  | 'PHASE_APPROVED'
  | 'PHASE_REVISION'
  | 'QUESTION_ASKED'
  | 'QUESTION_ANSWERED'
  | 'COMMENT_ADDED'
  | 'MEETING_DUE'
  | 'PAPER_SUBMITTED'
  | 'PAPER_PUBLISHED'

// ─── Database ───────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:                    string
          email:                 string
          full_name:             string | null
          avatar_url:            string | null
          role:                  UserRole
          role_subtype:          RoleSubtype
          expertise_domains:     string[]
          bio_short:             string | null
          available_slots:       number
          linkedin_url:          string | null
          institution:           string
          google_id:             string | null
          google_access_token:   string | null
          google_refresh_token:  string | null
          created_at:            string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'expertise_domains' | 'available_slots' | 'institution'>
          & { expertise_domains?: string[]; available_slots?: number; institution?: string }
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

      research_projects: {
        Row: {
          id:                  string
          owner_id:            string | null
          subject_id:          string | null
          title:               string | null
          domain:              string | null
          target_venue:        string | null
          abstract:            string | null
          tags:                string[] | null
          approval_status:     'draft' | 'pending_review' | 'approved' | 'needs_revision'
          teacher_feedback:    string | null
          is_visible_to_class: boolean
          created_at:          string
          updated_at:          string
        }
        Insert: Omit<Database['public']['Tables']['research_projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['research_projects']['Insert']>
      }

      research_phases: {
        Row: {
          id:                  string
          project_id:          string | null
          number:              number | null
          title:               string | null
          description:         string | null
          planned_outcome:     string | null
          status:              PhaseStatus
          trl:                 number | null
          budget_inr:          number
          student_observation: string | null
          ai_suggestions:      Json | null
          linked_assignment_id: string | null
          completed_at:        string | null
        }
        Insert: Omit<Database['public']['Tables']['research_phases']['Row'], 'id' | 'budget_inr'>
          & { budget_inr?: number }
        Update: Partial<Database['public']['Tables']['research_phases']['Insert']>
      }

      paper_sections: {
        Row: {
          id:           string
          project_id:   string | null
          section_type: string | null
          content:      string | null
          order:        number | null
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['paper_sections']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['paper_sections']['Insert']>
      }

      project_supervisors: {
        Row: {
          id:              string
          project_id:      string
          supervisor_id:   string
          supervisor_type: SupervisorType
          tagged_phases:   number[]
          tagged_sections: string[]
          assigned_by:     string | null
          assigned_at:     string
          active:          boolean
        }
        Insert: Omit<Database['public']['Tables']['project_supervisors']['Row'], 'id' | 'assigned_at'>
          & { assigned_at?: string }
        Update: Partial<Database['public']['Tables']['project_supervisors']['Insert']>
      }

      phase_signoffs: {
        Row: {
          id:            string
          phase_id:      string
          supervisor_id: string
          decision:      SignoffDecision
          feedback:      string | null
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['phase_signoffs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['phase_signoffs']['Insert']>
      }

      supervision_comments: {
        Row: {
          id:          string
          project_id:  string
          phase_id:    string | null
          section_key: string | null
          author_id:   string
          content:     string
          is_private:  boolean
          parent_id:   string | null
          created_at:  string
          updated_at:  string
        }
        Insert: Omit<Database['public']['Tables']['supervision_comments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['supervision_comments']['Insert']>
      }

      supervision_meetings: {
        Row: {
          id:            string
          project_id:    string
          supervisor_id: string
          student_id:    string
          scheduled_at:  string
          agenda:        string | null
          notes:         string | null
          action_items:  Json
          status:        'scheduled' | 'completed' | 'cancelled'
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['supervision_meetings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['supervision_meetings']['Insert']>
      }

      research_questions: {
        Row: {
          id:                  string
          project_id:          string
          student_id:          string
          question:            string
          context:             string | null
          checklist_completed: boolean
          status:              'pending' | 'answered' | 'closed'
          answered_by:         string | null
          answer:              string | null
          created_at:          string
          answered_at:         string | null
        }
        Insert: Omit<Database['public']['Tables']['research_questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['research_questions']['Insert']>
      }

      notifications: {
        Row: {
          id:         string
          user_id:    string
          type:       NotificationType
          data:       Json
          read:       boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }

      hardware_inventory: {
        Row: {
          id:               string
          asset_code:       string
          name:             string
          category:         string
          model:            string | null
          description:      string | null
          storage_location: string | null
          total_quantity:   number
          minimum_quantity: number
          unit_cost_inr:    number | null
          condition:        HardwareCondition
          created_by:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['hardware_inventory']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['hardware_inventory']['Insert']>
      }

      hardware_loans: {
        Row: {
          id:                string
          inventory_item_id: string
          borrower_id:       string
          project_id:        string | null
          issued_by:         string
          quantity:          number
          returned_quantity: number
          purpose:           string | null
          issued_at:         string
          due_at:            string | null
          returned_at:       string | null
          return_notes:      string | null
          status:            HardwareLoanStatus
          created_at:        string
          updated_at:        string
        }
        Insert: Omit<Database['public']['Tables']['hardware_loans']['Row'], 'id' | 'returned_quantity' | 'issued_at' | 'returned_at' | 'return_notes' | 'created_at' | 'updated_at'>
          & {
            id?: string
            returned_quantity?: number
            issued_at?: string
            returned_at?: string | null
            return_notes?: string | null
            created_at?: string
            updated_at?: string
          }
        Update: Partial<Database['public']['Tables']['hardware_loans']['Insert']>
      }

      project_progress_updates: {
        Row: {
          id:               string
          project_id:       string
          author_id:        string
          progress_percent: number
          status:           ProjectProgressStatus
          summary:          string
          accomplishments:  string | null
          blockers:         string | null
          next_steps:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['project_progress_updates']['Row'], 'id' | 'created_at' | 'updated_at'>
          & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['project_progress_updates']['Insert']>
      }

      simulator_events: {
        Row: {
          id:           string
          event_type:   'lab_view' | 'sign_in' | 'challenge_completed' | 'sketch_run'
          session_id:   string
          user_id:      string | null
          path:         string | null
          board_id:     string | null
          challenge_id: string | null
          metadata:     Json | null
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['simulator_events']['Row'], 'id' | 'created_at'>
          & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['simulator_events']['Insert']>
      }

      // Legacy tables (unchanged)
      units: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      sessions: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      enrollments: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      assignment_submissions: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      student_progress: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      forum_posts: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      forum_replies: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      reminder_schedules: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      sync_log: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
      ai_usage_log: { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
    }
    Views:    Record<string, never>
    Functions: Record<string, never>
    Enums:    Record<string, never>
  }
}

// ─── Convenience row types ───────────────────────────────────────────────────

export type Profile             = Database['public']['Tables']['profiles']['Row']
export type ResearchProject     = Database['public']['Tables']['research_projects']['Row']
export type ResearchPhase       = Database['public']['Tables']['research_phases']['Row']
export type PaperSection        = Database['public']['Tables']['paper_sections']['Row']
export type ProjectSupervisor   = Database['public']['Tables']['project_supervisors']['Row']
export type PhaseSignoff        = Database['public']['Tables']['phase_signoffs']['Row']
export type SupervisionComment  = Database['public']['Tables']['supervision_comments']['Row']
export type SupervisionMeeting  = Database['public']['Tables']['supervision_meetings']['Row']
export type ResearchQuestion    = Database['public']['Tables']['research_questions']['Row']
export type Notification        = Database['public']['Tables']['notifications']['Row']
export type HardwareInventoryItem = Database['public']['Tables']['hardware_inventory']['Row']
export type HardwareLoan          = Database['public']['Tables']['hardware_loans']['Row']
export type ProjectProgressUpdate = Database['public']['Tables']['project_progress_updates']['Row']
