import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database, NotificationType } from '@/types/database'

// ─── Email subjects per notification type ────────────────────────────────────

const EMAIL_SUBJECTS: Partial<Record<NotificationType, string>> = {
  SUPERVISOR_ASSIGNED: 'You have been assigned a supervisor',
  PHASE_SUBMITTED:     'A phase is ready for your review',
  PHASE_APPROVED:      'Your phase has been approved',
  PHASE_REVISION:      'Revision requested for your phase',
  QUESTION_ANSWERED:   'Your research question has been answered',
  MEETING_DUE:         'Upcoming supervision meeting',
}

// ─── Service client (bypasses RLS for notification inserts) ──────────────────

function getServiceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Main notification sender ─────────────────────────────────────────────────

/**
 * Insert a notification row for `recipientId` and optionally send an email.
 * Email failures are silently caught so they never block the caller.
 */
export async function sendNotification(
  type: NotificationType,
  recipientId: string,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = getServiceClient()

  // Insert in-platform notification
  const { error } = await supabase.from('notifications').insert({
    user_id: recipientId,
    type,
    data,
  })

  if (error) {
    console.error('[sendNotification] DB insert failed:', error.message)
  }

  // Send email for types that warrant it
  const subject = EMAIL_SUBJECTS[type]
  if (subject && process.env.RESEND_API_KEY) {
    // Fetch recipient email — service client can read auth.users via profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientId)
      .single()

    if (profile?.email) {
      // Fire-and-forget: email failures must not propagate
      Promise.allSettled([
        sendEmail({
          to:      profile.email,
          subject,
          type,
          data: { ...data, recipientName: profile.full_name ?? 'there' },
        }),
      ]).catch(() => {})
    }
  }
}

// ─── Email dispatch via Resend ────────────────────────────────────────────────

interface EmailOptions {
  to:      string
  subject: string
  type:    NotificationType
  data:    Record<string, unknown>
}

async function sendEmail({ to, subject, type, data }: EmailOptions) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const html = buildEmailHtml(type, data)

  await resend.emails.send({
    from: 'IoT at CHRIST <noreply@iot.christuniversity.in>',
    to,
    subject,
    html,
  })
}

// ─── Inline email templates ───────────────────────────────────────────────────

function buildEmailHtml(type: NotificationType, data: Record<string, unknown>): string {
  const name = String(data.recipientName ?? 'there')

  const bodies: Partial<Record<NotificationType, string>> = {
    SUPERVISOR_ASSIGNED: `
      <p>Hi ${name},</p>
      <p>A supervisor has been assigned to your research project <strong>${data.projectTitle ?? ''}</strong>.</p>
      <p>Supervisor: <strong>${data.supervisorName ?? ''}</strong></p>
      <p>Log in to your dashboard to connect with your supervisor.</p>
    `,
    PHASE_SUBMITTED: `
      <p>Hi ${name},</p>
      <p>A student has submitted Phase <strong>${data.phaseTitle ?? ''}</strong> for your review.</p>
      <p>Project: <strong>${data.projectTitle ?? ''}</strong></p>
      <p>Please log in to review and sign off.</p>
    `,
    PHASE_APPROVED: `
      <p>Hi ${name},</p>
      <p>Great news! Phase <strong>${data.phaseTitle ?? ''}</strong> has been approved.</p>
      ${data.feedback ? `<p>Feedback: ${data.feedback}</p>` : ''}
      <p>Keep up the excellent work!</p>
    `,
    PHASE_REVISION: `
      <p>Hi ${name},</p>
      <p>Revision has been requested for Phase <strong>${data.phaseTitle ?? ''}</strong>.</p>
      ${data.feedback ? `<p>Feedback: ${data.feedback}</p>` : ''}
      <p>Please review the feedback and update your work.</p>
    `,
    QUESTION_ANSWERED: `
      <p>Hi ${name},</p>
      <p>Your research question has been answered:</p>
      <blockquote>${data.question ?? ''}</blockquote>
      <p><strong>Answer:</strong> ${data.answer ?? ''}</p>
    `,
    MEETING_DUE: `
      <p>Hi ${name},</p>
      <p>You have a supervision meeting scheduled for <strong>${data.scheduledAt ?? ''}</strong>.</p>
      ${data.agenda ? `<p>Agenda: ${data.agenda}</p>` : ''}
    `,
  }

  const body = bodies[type] ?? `<p>Hi ${name}, you have a new notification.</p>`

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #1B2E4B; padding: 16px; border-radius: 8px 8px 0 0;">
        <h2 style="color: #fff; margin: 0;">IoT at CHRIST</h2>
        <p style="color: #E8720C; margin: 4px 0 0;">Research Supervision Platform</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        ${body}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Christ University — M.Tech CSE IoT Programme</p>
      </div>
    </body>
    </html>
  `
}
