export type CategoryDef = {
  name: string
  description: string
}

// Jev's choice questions fan out to one yes/no per option, so a fuller default
// list is cheap. Users can add, rename, or remove any of these in Settings.
// Descriptions are written as the rule Jev should apply. Keep them distinct —
// overlapping categories are the main cause of fuzzy routing.
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: 'INTERVIEW', description: 'Interview scheduling, loops, onsites, or invites for interviews' },
  { name: 'RECRUITER', description: 'Recruiter outreach or hiring talk that is not a scheduled interview' },
  { name: 'JOB_OFFER', description: 'A concrete job or internship offer, contract, or compensation discussion' },
  { name: 'INVOICE', description: 'A bill or invoice asking you to pay something' },
  { name: 'RECEIPT', description: 'A payment confirmation or receipt where nothing is owed' },
  { name: 'FOLLOW_UP', description: 'Someone chasing a prior thread or waiting on your reply' },
  { name: 'MEETING', description: 'Meeting invites, calls, or scheduling that are not interviews' },
  { name: 'SUPPORT', description: 'Product, account, or billing support requests and issue reports' },
  { name: 'SHIPPING', description: 'Orders, delivery, tracking, or shipping updates' },
  { name: 'BANKING', description: 'Bank, card, or payment account statements and transactions' },
  { name: 'TRAVEL', description: 'Flight, hotel, or trip bookings, changes, and itineraries' },
  { name: 'ACADEMIC', description: 'Course, exam, grade, or university administration emails' },
  { name: 'SECURITY', description: 'Login alerts, password resets, or suspicious activity warnings' },
  { name: 'SOCIAL', description: 'Social network activity such as follows, mentions, or invites' },
  { name: 'NEWSLETTER', description: 'Newsletters, digests, or editorial content you chose to receive' },
  { name: 'PROMOTION', description: 'Marketing offers, discounts, or sales pitches' },
  { name: 'NOTIFICATION', description: 'Automated service alerts and status updates' },
  { name: 'PERSONAL', description: 'Personal correspondence from friends, family, or peers' },
  { name: 'SPAM', description: 'Phishing, crypto scams, or unsolicited junk' },
  { name: 'OTHER', description: 'Anything that does not fit another category' },
]

export const MAX_CATEGORIES = 60

const NAME_PATTERN = /^[A-Z][A-Z0-9_]{0,31}$/

// Names are upper-snake-case so they stay stable as keys for tones and filters.
export function normalizeName(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
}

export function sanitizeCategories(input: unknown): CategoryDef[] {
  if (!Array.isArray(input)) return DEFAULT_CATEGORIES

  const seen = new Set<string>()
  const out: CategoryDef[] = []

  for (const item of input) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const name = normalizeName(typeof record.name === 'string' ? record.name : '')
    const description =
      typeof record.description === 'string' ? record.description.replace(/\s+/g, ' ').trim() : ''
    if (!NAME_PATTERN.test(name) || seen.has(name)) continue
    seen.add(name)
    out.push({ name, description: description.slice(0, 200) || name.toLowerCase().replace(/_/g, ' ') })
    if (out.length >= MAX_CATEGORIES) break
  }

  if (!out.length) return DEFAULT_CATEGORIES
  if (!seen.has('OTHER')) {
    out.push({ name: 'OTHER', description: 'Anything that does not fit another category' })
  }
  return out
}
