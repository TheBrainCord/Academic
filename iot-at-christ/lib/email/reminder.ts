import { Resend } from 'resend'
import { SessionReminderEmail } from '@/emails/session-reminder'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ReminderPayload {
  to:            string
  studentName:   string
  sessionTitle:  string
  unitTitle:     string
  topics:        string[]
  keywords:      string[]
  toolLink?:     string
  dashboardUrl:  string
}

export async function sendSessionReminder(payload: ReminderPayload) {
  const { error } = await resend.emails.send({
    from:    process.env.EMAIL_FROM!,
    to:      payload.to,
    subject: `📡 Tomorrow: ${payload.sessionTitle} — Review your notes`,
    react:   SessionReminderEmail(payload),
  })

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`)
}
