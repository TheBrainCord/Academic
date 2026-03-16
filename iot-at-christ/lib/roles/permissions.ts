// Pure permission-check utilities — no DB calls.
// Server Actions call these after building a PermissionContext from the current user's profile
// and (when relevant) their project_supervisors row.

import type { PermissionContext } from '@/types/roles'

/** Primary supervisor or coordinator may sign off on phases. */
export function canSignOffPhase(ctx: PermissionContext): boolean {
  return (
    ctx.role === 'coordinator' ||
    ctx.role === 'teacher' ||
    (ctx.role === 'supervisor' && ctx.supervisorType === 'primary')
  )
}

/** Supervisors and coordinators can read private (internal) comments. */
export function canReadPrivateComments(ctx: PermissionContext): boolean {
  return ctx.role === 'supervisor' || ctx.role === 'coordinator' || ctx.role === 'teacher'
}

/** Only coordinators (and teachers acting as coordinators) may assign supervisors. */
export function canAssignSupervisor(ctx: PermissionContext): boolean {
  return ctx.role === 'coordinator' || ctx.role === 'teacher'
}

/** Whether the current user may read a given phase number within a project. */
export function canReadPhase(ctx: PermissionContext, phaseNumber: number): boolean {
  if (ctx.role === 'coordinator' || ctx.role === 'teacher') return true
  if (ctx.role === 'student') return true  // RLS already scopes to own project
  if (ctx.role === 'supervisor') {
    if (ctx.supervisorType === 'primary') return true
    if (ctx.supervisorType === 'advisor') {
      return (ctx.taggedPhases ?? []).includes(phaseNumber)
    }
  }
  return false
}

/** Whether the current user may read a given paper section within a project. */
export function canReadSection(ctx: PermissionContext, sectionKey: string): boolean {
  if (ctx.role === 'coordinator' || ctx.role === 'teacher') return true
  if (ctx.role === 'student') return true
  if (ctx.role === 'supervisor') {
    if (ctx.supervisorType === 'primary') return true
    if (ctx.supervisorType === 'advisor') {
      return (ctx.taggedSections ?? []).includes(sectionKey)
    }
  }
  return false
}

/** Only coordinators may publish/add papers to the published directory. */
export function canPublishPaper(ctx: PermissionContext): boolean {
  return ctx.role === 'coordinator' || ctx.role === 'teacher'
}

/** Supervisors and coordinators may answer questions. */
export function canAnswerQuestion(ctx: PermissionContext): boolean {
  return ctx.role === 'supervisor' || ctx.role === 'coordinator' || ctx.role === 'teacher'
}

/** Build a PermissionContext for a supervisor's access to a specific project. */
export function buildSupervisorContext(
  userId: string,
  role: PermissionContext['role'],
  subtype: PermissionContext['subtype'],
  projectSupervisorRow?: {
    supervisor_type: 'primary' | 'advisor'
    tagged_phases: number[]
    tagged_sections: string[]
    project_id: string
  } | null
): PermissionContext {
  return {
    userId,
    role,
    subtype,
    projectId:      projectSupervisorRow?.project_id,
    supervisorType: projectSupervisorRow?.supervisor_type,
    taggedPhases:   projectSupervisorRow?.tagged_phases ?? [],
    taggedSections: projectSupervisorRow?.tagged_sections ?? [],
  }
}
