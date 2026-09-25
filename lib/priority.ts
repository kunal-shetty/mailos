import type { Category, Priority } from '@/types'

export type CategoryTone = { avatar: string; dot: string; card: string }

const KNOWN_TONES: Record<string, CategoryTone> = {
  INTERVIEW: { avatar: 'bg-[#fecaca]', dot: 'bg-[#ef4444]', card: 'border-[#fecaca] bg-[#fff5f5]' },
  INVOICE: { avatar: 'bg-[#fde68a]', dot: 'bg-[#f59e0b]', card: 'border-[#fde68a] bg-[#fffbeb]' },
  RECRUITER: { avatar: 'bg-[#d9f99d]', dot: 'bg-[#65a30d]', card: 'border-[#d9f99d] bg-[#f7fee7]' },
  FOLLOW_UP: { avatar: 'bg-[#ddd6fe]', dot: 'bg-[#7c3aed]', card: 'border-[#ddd6fe] bg-[#f5f3ff]' },
  MEETING: { avatar: 'bg-[#bae6fd]', dot: 'bg-[#0284c7]', card: 'border-[#bae6fd] bg-[#f0f9ff]' },
  SUPPORT: { avatar: 'bg-[#fed7aa]', dot: 'bg-[#ea580c]', card: 'border-[#fed7aa] bg-[#fff7ed]' },
  SHIPPING: { avatar: 'bg-[#a5f3fc]', dot: 'bg-[#0891b2]', card: 'border-[#a5f3fc] bg-[#ecfeff]' },
  NEWSLETTER: { avatar: 'bg-[#fbcfe8]', dot: 'bg-[#db2777]', card: 'border-[#fbcfe8] bg-[#fdf2f8]' },
  NOTIFICATION: { avatar: 'bg-[#e2e8f0]', dot: 'bg-[#475569]', card: 'border-[#e2e8f0] bg-[#f8fafc]' },
  PERSONAL: { avatar: 'bg-[#c7d2fe]', dot: 'bg-[#4f46e5]', card: 'border-[#c7d2fe] bg-[#eef2ff]' },
  SPAM: { avatar: 'bg-[#e5e5e5]', dot: 'bg-[#737373]', card: 'border-black/8 bg-white' },
}

const FALLBACK_TONES: CategoryTone[] = [
  { avatar: 'bg-[#bfdbfe]', dot: 'bg-[#3b82f6]', card: 'border-black/8 bg-white' },
  { avatar: 'bg-[#e9d5ff]', dot: 'bg-[#9333ea]', card: 'border-black/8 bg-white' },
  { avatar: 'bg-[#bbf7d0]', dot: 'bg-[#16a34a]', card: 'border-black/8 bg-white' },
  { avatar: 'bg-[#fecdd3]', dot: 'bg-[#e11d48]', card: 'border-black/8 bg-white' },
]

// Custom categories get a stable colour derived from their name.
export function categoryTone(category: Category): CategoryTone {
  const known = KNOWN_TONES[category]
  if (known) return known
  let hash = 0
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) >>> 0
  return FALLBACK_TONES[hash % FALLBACK_TONES.length]
}

export function priorityLabel(priority: Priority) {
  if (priority === 'HIGH') return { emoji: '🔴', text: 'High' }
  if (priority === 'MEDIUM') return { emoji: '🟡', text: 'Medium' }
  return { emoji: '🟢', text: 'Low' }
}

export function actionHeadline(email: {
  jev: { category: Category }
  groq: { company: string; date: string | null; time: string | null; amount: string | null; actions: string[] }
  subject: string
  snippet?: string
}) {
  if (email.jev.category === 'INTERVIEW') {
    return {
      title: `Interview${email.groq.company ? ` · ${email.groq.company}` : ''}`,
      detail: [email.groq.date, email.groq.time].filter(Boolean).join(' ') || 'Time detected',
    }
  }
  if (email.jev.category === 'INVOICE') {
    return {
      title: `${email.groq.company} invoice`,
      detail: email.groq.amount ? `Due ${email.groq.date ?? 'soon'} · ${email.groq.amount}` : email.subject,
    }
  }
  if (email.jev.category === 'RECRUITER') {
    return {
      title: `Reply to ${email.groq.company} recruiter`,
      detail: email.groq.actions.includes('Reply') ? 'Reply today' : email.subject,
    }
  }
  if (email.jev.category === 'FOLLOW_UP') {
    return {
      title: `Follow up with ${email.groq.company}`,
      detail: email.snippet ?? email.subject,
    }
  }
  return { title: email.subject, detail: email.groq.company }
}
