import type { Category, JevResult, Priority } from '@/types'

const QUESTIONS = {
  category: {
    type: 'choice',
    instructions: 'Route this email. No summary. Pick the single best mailbox.',
    criteria: {
      INTERVIEW: 'Interview scheduling, loops, onsites, or calendar invites for interviews',
      RECRUITER: 'Recruiter outreach or hiring conversations that are not a scheduled interview',
      INVOICE: 'Bills, invoices, receipts, payment due',
      FOLLOW_UP: 'Someone chasing a prior thread or waiting on a reply',
      SPAM: 'Phishing, crypto scams, unsolicited junk',
      OTHER: 'Newsletters, social, or anything else',
    },
  },
  priority: {
    type: 'choice',
    instructions: 'How urgent is a human response?',
    criteria: {
      HIGH: 'Time-sensitive: interview, due tomorrow, recruiter waiting',
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

function heuristic(subject: string, body: string, sender: string): JevResult {
  const text = `${subject} ${body} ${sender}`.toLowerCase()
  const hit = (words: string[]) => words.some((w) => text.includes(w))

  let category: Category = 'OTHER'
  if (hit(['unsubscribe', 'btc', 'crypto', 'winner', 'viagra', 'lottery'])) category = 'SPAM'
  else if (hit(['interview', 'onsite', 'phone screen', 'loop'])) category = 'INTERVIEW'
  else if (hit(['invoice', 'receipt', 'payment due', 'billing'])) category = 'INVOICE'
  else if (hit(['recruiter', 'recruiting', 'opportunity', 'role', 'hiring'])) category = 'RECRUITER'
  else if (hit(['following up', 'follow up', 'checking in', 'circling back', 'did you get'])) {
    category = 'FOLLOW_UP'
  }

  const priority: Priority =
    category === 'INTERVIEW' || hit(['tomorrow', 'today', 'urgent', 'due'])
      ? 'HIGH'
      : category === 'SPAM' || category === 'OTHER'
        ? 'LOW'
        : 'MEDIUM'

  return {
    category,
    priority,
    needs_reply: category === 'INTERVIEW' || category === 'RECRUITER' || category === 'FOLLOW_UP',
    calendar: category === 'INTERVIEW' || hit(['am', 'pm', 'at ']),
    confidence: 0.82,
  }
}

export async function classifyEmail(input: {
  subject: string
  body: string
  sender: string
}): Promise<JevResult> {
  const key = process.env.JEV_AGENT_KEY
  if (!key) return heuristic(input.subject, input.body, input.sender)

  try {
    const res = await fetch('https://jev-agent.com/api/v1/systemone', {
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
        questions: QUESTIONS,
      }),
    })

    if (!res.ok) return heuristic(input.subject, input.body, input.sender)

    const data = await res.json()
    const answers = data.answers ?? {}
    const category = (answers.category?.choice ?? 'OTHER') as Category
    const priority = (answers.priority?.choice ?? 'MEDIUM') as Priority
    const needs = Number(answers.needs_reply?.noul ?? 0) >= 0.5
    const calendar = Number(answers.calendar?.noul ?? 0) >= 0.5
    const confidence = Number(answers.category?.confidence ?? 0.8)

    return { category, priority, needs_reply: needs, calendar, confidence }
  } catch {
    return heuristic(input.subject, input.body, input.sender)
  }
}
