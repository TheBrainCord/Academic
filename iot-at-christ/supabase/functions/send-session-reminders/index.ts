import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

serve(async () => {
  // Window: sessions scheduled 23h–25h from now
  const now     = new Date()
  const from    = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString()
  const to      = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, hours, topics, keywords, tools, units(title, number, subjects(id))')
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)

  if (!sessions?.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No sessions in window' }))
  }

  let sent = 0
  const errors: string[] = []

  for (const session of sessions) {
    const subjectId = (session.units as any)?.subjects?.id
    if (!subjectId) continue

    // Get enrolled students for this subject
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id, profiles(email, full_name)')
      .eq('subject_id', subjectId)

    for (const enroll of enrollments ?? []) {
      const studentId = enroll.student_id
      const profile   = enroll.profiles as any

      // Idempotency check — skip if already sent
      const { data: existing } = await supabase
        .from('reminder_schedules')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', studentId)
        .single()

      if (existing) continue  // already sent — do not send duplicate

      try {
        await resend.emails.send({
          from:    Deno.env.get('EMAIL_FROM')!,
          to:      profile.email,
          subject: `📡 Tomorrow: ${session.title} — Review your notes`,
          html:    buildEmailHtml({
            studentName:  profile.full_name,
            sessionTitle: session.title,
            unitTitle:    (session.units as any)?.title,
            topics:       (session.topics as string[]) ?? [],
            keywords:     (session.keywords as string[]) ?? [],
            dashboardUrl: `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/student/dashboard`,
          }),
        })

        // Mark as sent — idempotency guard for next run
        await supabase.from('reminder_schedules').insert({
          session_id: session.id,
          student_id: studentId,
          status:     'sent',
        })

        sent++
      } catch (e: any) {
        errors.push(`${profile.email}: ${e.message}`)
        await supabase.from('reminder_schedules').upsert({
          session_id: session.id,
          student_id: studentId,
          status:     'failed',
        }, { onConflict: 'session_id,student_id' })
      }
    }
  }

  return new Response(JSON.stringify({ sent, errors }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function buildEmailHtml(p: {
  studentName:  string
  sessionTitle: string
  unitTitle:    string
  topics:       string[]
  keywords:     string[]
  dashboardUrl: string
}): string {
  return `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1B2E4B;">
  <div style="background: #1B2E4B; padding: 24px; text-align: center;">
    <p style="color: #E8720C; font-size: 12px; letter-spacing: 2px; margin: 0;">IoT AT CHRIST</p>
    <h1 style="color: white; font-size: 20px; margin: 8px 0 0;">Session Tomorrow</h1>
  </div>
  <div style="padding: 32px 24px;">
    <p>Hi ${p.studentName?.split(' ')[0]},</p>
    <p>Your session <strong>${p.sessionTitle}</strong> (${p.unitTitle}) is scheduled for tomorrow.</p>
    <h3 style="color: #1B2E4B; border-bottom: 2px solid #E8720C; padding-bottom: 4px;">Topics to Review</h3>
    <ul>
      ${p.topics.slice(0, 4).map(t => `<li>${t}</li>`).join('')}
    </ul>
    <h3 style="color: #1B2E4B;">Key Terms</h3>
    <p style="font-family: monospace; font-size: 13px; color: #555;">
      ${p.keywords.join(' · ')}
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${p.dashboardUrl}" style="background: #E8720C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
        Open Dashboard →
      </a>
    </div>
    <p style="font-size: 12px; color: #999; margin-top: 32px; text-align: center;">
      You're enrolled in IoT at CHRIST · Christ University Bengaluru
    </p>
  </div>
</div>`
}
