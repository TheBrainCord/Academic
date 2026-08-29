import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import yaml from 'js-yaml'
import { SubjectSchema } from '../_schema'

const MUTABLE_CLAIM = /(?:\b(?:19|20)\d{2}\b|\d+(?:\.\d+)?\s*%|[$₹€£]\s*\d|\b(?:TLS\s*1\.3|HTTP\/2|Wi-Fi\s*6|GPT-\d)\b|\b(?:GDPR|DPDPA|legal status|mandatory reporting|retired)\b|\b(?:deploy(?:ed|ing|ment)?|fleet|readings|devices|sensors|units)\b[^.]{0,35}\b\d[\d,]*\b)/i

function loadSubject() {
  const source = fs.readFileSync(path.join(process.cwd(), 'content/subjects/iot.yaml'), 'utf8')
  return SubjectSchema.parse(yaml.load(source))
}

describe('subject reference policy', () => {
  it('accepts the IoT course and its structured references', () => {
    expect(loadSubject().curriculumStatus.livingCurriculumLabel).toBe('Living curriculum update')
  })

  it('requires authoritative references for mutable claims', () => {
    for (const unit of loadSubject().units) {
      for (const session of unit.sessions) {
        const claims = [...session.topics, session.case_study?.title ?? '', session.case_study?.description ?? '']
        if (claims.some((claim) => MUTABLE_CLAIM.test(claim))) {
          expect(session.references?.length, `Session ${session.number} has an unreferenced mutable claim`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('keeps references complete and freshly verifiable', () => {
    for (const unit of loadSubject().units) for (const session of unit.sessions) {
      for (const reference of session.references ?? []) {
        expect(reference.authoritativeUrl).toMatch(/^https:\/\//)
        expect(reference.claimScope.length).toBeGreaterThan(20)
        expect(reference.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    }
  })
})
