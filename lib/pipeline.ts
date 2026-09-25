import { DEFAULT_CATEGORIES, type CategoryDef } from '@/lib/categories'
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

export async function processInbox(user: SessionUser, categories: CategoryDef[] = DEFAULT_CATEGORIES) {
  if (!user.accessToken) {
    throw new Error('No Gmail access token. Reconnect your Google account.')
  }

  const raw = await fetchLatestEmails(user.accessToken, 30)
  const emails: MailEmail[] = await Promise.all(
    raw.map(async (item) => {
      const jev = await classifyEmail({
        subject: item.subject,
        body: item.body,
        sender: `${item.sender} <${item.senderEmail}>`,
        categories,
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
