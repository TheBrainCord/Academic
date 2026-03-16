import { z } from 'zod'

// Zod schema for subject YAML files
// Any .yaml file in /content/subjects/ that passes this will work with the platform.

export const AssignmentSchema = z.object({
  type:     z.string(),
  task:     z.string(),
  xp:       z.number().int().positive(),
  due_days: z.number().int().positive(),
})

export const CaseStudySchema = z.object({
  title:       z.string(),
  org:         z.string(),
  description: z.string(),
})

export const SessionSchema = z.object({
  number:             z.number().int().positive(),
  title:              z.string(),
  hours:              z.number().positive(),
  topics:             z.array(z.string()),
  keywords:           z.array(z.string()),
  case_study:         CaseStudySchema.optional(),
  tools:              z.array(z.string()).optional(),
  assignment:         AssignmentSchema.optional(),
  no_hw_alternative:  z.string().optional(),
})

export const UnitSchema = z.object({
  number:   z.number().int().positive(),
  title:    z.string(),
  hours:    z.number().positive(),
  icon:     z.string(),
  color:    z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  sessions: z.array(SessionSchema),
})

export const MissionSchema = z.object({
  title:             z.string(),
  story:             z.string(),
  situation:         z.string(),
  challenge:         z.string(),
  deliverables:      z.array(z.string()),
  hints:             z.array(z.string()),
  domain:            z.string(),
  difficulty:        z.enum(['Easy', 'Medium', 'Hard']),
  xp:                z.number().int().positive(),
  status:            z.enum(['active', 'locked']),
  tags:              z.array(z.string()),
  unlock_after_unit: z.number().int().optional(),
})

export const SubjectSchema = z.object({
  slug:        z.string().regex(/^[a-z0-9-]+$/),
  name:        z.string(),
  description: z.string(),
  year:        z.string(),
  semester:    z.string(),
  units:       z.array(UnitSchema),
  missions:    z.array(MissionSchema).optional(),
})

export type SubjectYAML = z.infer<typeof SubjectSchema>
