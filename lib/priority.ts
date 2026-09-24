import type { Category, Priority } from '@/types'

export function categoryTone(category: Category) {
  switch (category) {
    case 'INTERVIEW':
      return { avatar: 'bg-[#fecaca]', dot: 'bg-[#ef4444]', card: 'border-[#fecaca] bg-[#fff5f5]' }
    case 'INVOICE':
      return { avatar: 'bg-[#fde68a]', dot: 'bg-[#f59e0b]', card: 'border-[#fde68a] bg-[#fffbeb]' }
    case 'RECRUITER':
      return { avatar: 'bg-[#d9f99d]', dot: 'bg-[#65a30d]', card: 'border-[#d9f99d] bg-[#f7fee7]' }
    case 'FOLLOW_UP':
      return { avatar: 'bg-[#ddd6fe]', dot: 'bg-[#7c3aed]', card: 'border-[#ddd6fe] bg-[#f5f3ff]' }
    case 'SPAM':
      return { avatar: 'bg-[#e5e5e5]', dot: 'bg-[#737373]', card: 'border-black/8 bg-white' }
    default:
      return { avatar: 'bg-[#bfdbfe]', dot: 'bg-[#3b82f6]', card: 'border-black/8 bg-white' }
  }
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
