import { DEFAULT_CATEGORIES, sanitizeCategories, type CategoryDef } from '@/lib/categories'
import type { JevResult, Priority } from '@/types'

// Keyword hints used only when Jev is unavailable, so the fallback still maps
// onto whatever categories the user has configured.
const KEYWORDS: Record<string, string[]> = {
  INTERVIEW: ['interview', 'onsite', 'phone screen', 'loop', 'hiring manager'],
  RECRUITER: ['recruiter', 'recruiting', 'opportunity', 'hiring', 'new grad'],
  INVOICE: ['invoice', 'receipt', 'payment due', 'billing', 'amount due'],
  FOLLOW_UP: ['following up', 'follow up', 'checking in', 'circling back', 'did you get'],
  MEETING: ['meeting', 'invite', 'calendar', 'schedule a call', 'reschedule'],
  SUPPORT: ['support', 'ticket', 'bug', 'issue with', 'help with'],
  SHIPPING: ['shipped', 'delivery', 'tracking', 'out for delivery'],
  NEWSLETTER: ['newsletter', 'digest', 'weekly roundup', 'unsubscribe'],
  NOTIFICATION: ['notification', 'alert', 'verify your', 'security'],
  PERSONAL: ['hey', 'thanks for', 'catch up', 'how are you'],
  SPAM: ['btc', 'crypto', 'winner', 'viagra', 'lottery', 'claim now'],
}

const REPLY_CATEGORIES = ['INTERVIEW', 'RECRUITER', 'FOLLOW_UP', 'MEETING', 'SUPPORT', 'PERSONAL']
const CALENDAR_CATEGORIES = ['INTERVIEW', 'MEETING']

function questionsFor(categories: CategoryDef[]) {
  return {
    category: {
      type: 'choice',
      instructions: 'Route this email. No summary. Pick the single best category.',
      criteria: Object.fromEntries(categories.map((category) => [category.name, category.description])),
    },
    priority: {
      type: 'choice',
      instructions: 'How urgent is a human response?',
      criteria: {
        HIGH: 'Time-sensitive: interview, due tomorrow, someone waiting',
        MEDIUM: 'Should be handled this week',
        LOW: 'Can wait or ignore',
      },
    },
    needs_reply: {
      type: 'noul',
      instructions: 'Does this email expect a reply from the recipient?',
      criteria: { true: 'A person is waiting on an answer', false: 'No reply needed' },
    },
    calendar: {
      type: 'noul',
      instructions: 'Does this contain a meeting time the recipient should calendar?',
      criteria: { true: 'A specific date/time to attend', false: 'No event' },
    },
  }
}

function heuristic(subject: string, body: string, sender: string, categories: CategoryDef[]): JevResult {
  const text = `${subject} ${body} ${sender}`.toLowerCase()
  const names = categories.map((category) => category.name)
  const hit = (words: string[]) => words.some((word) => text.includes(word))

  const pick = (preferred: string) => (names.includes(preferred) ? preferred : names[0] ?? 'OTHER')

  let category = pick('OTHER')
  if (names.includes('SPAM') && hit(KEYWORDS.SPAM)) {
    category = 'SPAM'
  } else {
    for (const name of names) {
      if (name === 'SPAM' || name === 'OTHER') continue
      const words =
        KEYWORDS[name] ??
        name.toLowerCase().split('_').filter((part) => part.length > 3)
      if (words.length && hit(words)) {
        category = name
        break
      }
    }
  }

  const priority: Priority =
    CALENDAR_CATEGORIES.includes(category) || hit(['tomorrow', 'today', 'urgent', 'due'])
      ? 'HIGH'
      : ['SPAM', 'NEWSLETTER', 'NOTIFICATION', 'OTHER'].includes(category)
        ? 'LOW'
        : 'MEDIUM'

  return {
    category,
    priority,
    needs_reply: REPLY_CATEGORIES.includes(category),
    calendar: CALENDAR_CATEGORIES.includes(category) || hit(['am', 'pm', 'at ']),
    confidence: 0.82,
  }
}

export async function classifyEmail(input: {
  subject: string
  body: string
  sender: string
  categories?: CategoryDef[]
}): Promise<JevResult> {
  const categories = input.categories?.length ? sanitizeCategories(input.categories) : DEFAULT_CATEGORIES
  const key = process.env.JEV_AGENT_KEY ?? process.env.TYPESAFE_API_KEY
  if (!key) return heuristic(input.subject, input.body, input.sender, categories)

  try {
    const res = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jev-latest',
        state: {
          subject: input.subject,
          body: input.body.slice(0, 4000),
          sender: input.sender,
        },
        questions: questionsFor(categories),
      }),
    })

    if (!res.ok) return heuristic(input.subject, input.body, input.sender, categories)

    const data = await res.json()
    const answers = data.answers ?? {}
    const names = categories.map((category) => category.name)
    const rawCategory = answers.category?.choice
    const category = typeof rawCategory === 'string' && names.includes(rawCategory) ? rawCategory : (names[0] ?? 'OTHER')
    const rawPriority = answers.priority?.choice
    const priority: Priority =
      rawPriority === 'HIGH' || rawPriority === 'MEDIUM' || rawPriority === 'LOW' ? rawPriority : 'MEDIUM'
    const needs = Number(answers.needs_reply?.noul ?? 0) >= 0.5
    const calendar = Number(answers.calendar?.noul ?? 0) >= 0.5
    const confidence = Number(answers.category?.confidence ?? 0.8)

    return { category, priority, needs_reply: needs, calendar, confidence }
  } catch {
    return heuristic(input.subject, input.body, input.sender, categories)
  }
}
