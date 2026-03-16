import type { UserRole, RoleSubtype } from './database'

// Context passed to permission-check functions.
// Built once per request from the authenticated user's profile + project_supervisors row.
export interface PermissionContext {
  userId:         string
  role:           UserRole
  subtype:        RoleSubtype
  // Set when viewing a specific project
  projectId?:     string
  supervisorType?: 'primary' | 'advisor'
  taggedPhases?:  number[]
  taggedSections?: string[]
}

export type Permission =
  | 'project:read'
  | 'project:write'
  | 'phase:read'
  | 'phase:write'
  | 'phase:signoff'
  | 'comment:read_private'
  | 'comment:write'
  | 'supervisor:assign'
  | 'paper:publish'
  | 'question:answer'
