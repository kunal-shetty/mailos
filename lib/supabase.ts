import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { MailEmail } from '@/types'

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function persistInbox(owner: string, emails: MailEmail[]) {
  const supabase = getSupabase()
  if (!supabase) return { persisted: false }

  const emailRows = emails.map((email) => ({
    id: email.id,
    owner,
    subject: email.subject,
    sender: email.sender,
    snippet: email.snippet,
    received_at: email.receivedAt,
  }))

  const aiRows = emails.map((email) => ({
    email_id: email.id,
    owner,
    category: email.jev.category,
    priority: email.jev.priority,
    confidence: email.jev.confidence,
    actions: email.groq.actions,
    extra: { jev: email.jev, groq: email.groq },
  }))

  await supabase.from('emails').upsert(emailRows)
  await supabase.from('ai_results').upsert(aiRows, { onConflict: 'email_id' })
  return { persisted: true }
}
