/**
 * Seed script: reads all .yaml files from /content/subjects/,
 * validates against the schema, then upserts to Supabase.
 *
 * Safe to run multiple times (idempotent — upserts by slug/number).
 * Run: npx tsx scripts/seed-subjects.ts
 */

import * as fs   from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { createClient } from '@supabase/supabase-js'
import { SubjectSchema } from '../content/subjects/_schema'
import type { SubjectYAML } from '../content/subjects/_schema'

// Use service role for seeding — runs locally, never in browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CONTENT_DIR = path.join(__dirname, '../content/subjects')

async function seedSubject(filePath: string): Promise<void> {
  const filename = path.basename(filePath)

  // Parse YAML
  const raw     = fs.readFileSync(filePath, 'utf8')
  const parsed  = yaml.load(raw)

  // Validate against schema
  const result = SubjectSchema.safeParse(parsed)
  if (!result.success) {
    console.error(`❌ ${filename}: validation failed`)
    result.error.errors.forEach(e => console.error(`   ${e.path.join('.')} — ${e.message}`))
    return
  }

  const subject: SubjectYAML = result.data

  // Upsert subject — slug is the unique key
  const { data: subjectRow, error: subjectErr } = await supabase
    .from('subjects')
    .upsert({
      slug:        subject.slug,
      name:        subject.name,
      description: subject.description,
      year:        subject.year,
      semester:    subject.semester,
      config:      parsed as any,  // store full YAML (includes missions) as JSONB
    }, { onConflict: 'slug' })
    .select('id')
    .single()

  if (subjectErr || !subjectRow) {
    console.error(`❌ ${filename}: subject upsert failed — ${subjectErr?.message}`)
    return
  }

  const subjectId = subjectRow.id

  // Upsert units
  for (const unit of subject.units) {
    const { data: unitRow, error: unitErr } = await supabase
      .from('units')
      .upsert({
        subject_id: subjectId,
        number:     unit.number,
        title:      unit.title,
        hours:      unit.hours,
        icon:       unit.icon,
        color_hex:  unit.color,
      }, { onConflict: 'subject_id,number' })
      .select('id')
      .single()

    if (unitErr || !unitRow) {
      console.error(`   ❌ Unit ${unit.number}: ${unitErr?.message}`)
      continue
    }

    const unitId = unitRow.id

    // Upsert sessions
    for (const session of unit.sessions) {
      const { error: sessionErr } = await supabase
        .from('sessions')
        .upsert({
          unit_id:            unitId,
          number:             session.number,
          title:              session.title,
          hours:              session.hours,
          topics:             session.topics,
          keywords:           session.keywords,
          // References travel with the case-study JSON because the existing table has no
          // standalone references column. The full, canonical structure also remains in config.
          case_study:         session.case_study
            ? { ...session.case_study, references: session.references ?? [] }
            : null,
          tools:              session.tools ?? null,
          assignment:         session.assignment ?? null,
          no_hw_alternative:  session.no_hw_alternative ?? null,
        }, { onConflict: 'unit_id,number' })

      if (sessionErr) {
        console.error(`   ❌ Session ${session.number}: ${sessionErr.message}`)
      }
    }
  }

  const totalSessions = subject.units.reduce((sum, u) => sum + u.sessions.length, 0)
  console.log(`✅ ${filename}: ${subject.units.length} units, ${totalSessions} sessions, ${subject.missions?.length ?? 0} missions`)
}

async function main() {
  console.log('🌱 Seeding subjects…\n')

  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.yaml') && !f.startsWith('_'))
    .map(f => path.join(CONTENT_DIR, f))

  if (files.length === 0) {
    console.log('No YAML files found in /content/subjects/')
    return
  }

  for (const file of files) {
    await seedSubject(file)
  }

  console.log('\nDone.')
}

main().catch(console.error)
