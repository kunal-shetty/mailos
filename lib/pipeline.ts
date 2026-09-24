import { demoEmails, demoStats } from '@/lib/demo-data'
import { fetchLatestEmails } from '@/lib/gmail'
import { extractActions } from '@/lib/groq'
import { classifyEmail } from '@/lib/jev'
import { persistInbox } from '@/lib/supabase'
import type { DashboardStats, MailEmail, SessionUser } from '@/types'

function statsFrom(emails: MailEmail[]): DashboardStats {
  const invoices = emails.filter((e) => e.jev.category === 'INVOICE')
  const amount =
    invoices.map((e) => e.groq.amount).find(Boolean) ??
    (invoices.length ? `${invoices.length} open` : '₹0')
  return {
    unread: emails.filter((e) => e.unread).length,
    recruiters: emails.filter((e) => e.jev.category === 'RECRUITER').length,
    interviews: emails.filter((e) => e.jev.category === 'INTERVIEW').length,
    invoices: amount,
    followUps: emails.filter((e) => e.jev.category === 'FOLLOW_UP').length,
  }
}

export async function processInbox(user: SessionUser) {
  if (user.mode === 'demo' || !user.accessToken) {
    await persistInbox(user.email, demoEmails)
    return { emails: demoEmails, stats: demoStats, source: 'demo' as const }
  }

  const raw = await fetchLatestEmails(user.accessToken, 30)
  const emails: MailEmail[] = await Promise.all(
    raw.map(async (item) => {
      const jev = await classifyEmail({
        subject: item.subject,
        body: item.body,
        sender: `${item.sender} <${item.senderEmail}>`,
      })
      const groq = await extractActions({
        subject: item.subject,
        body: item.body,
        sender: `${item.sender} <${item.senderEmail}>`,
      })
      return { ...item, jev, groq }
    }),
  )

  await persistInbox(user.email, emails)
  return { emails, stats: statsFrom(emails), source: 'gmail' as const }
}
