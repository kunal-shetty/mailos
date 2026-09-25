import type { EmailAnalysis, GroqResult } from '@/types'

function heuristic(subject: string, body: string, sender: string): GroqResult {
  const text = `${subject}\n${body}`
  const time = text.match(/\b(\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm))\b/)?.[1] ?? null
  const date =
    text.match(/\b(tomorrow|today|monday|tuesday|wednesday|thursday|friday|this week)\b/i)?.[1] ??
    null
  const amount = text.match(/(₹\s?\d[\d,]*|\$\s?\d[\d,]*)/)?.[1] ?? null
  const company =
    sender.split('@')[1]?.split('.')[0]?.replace(/\b\w/g, (c) => c.toUpperCase()) ||
    sender.split(' ')[0] ||
    'Unknown'

  const actions: string[] = []
  if (/interview|recruiter|follow/i.test(text)) actions.push('Reply')
  if (time || /interview/i.test(text)) actions.push('Set Reminder')
  if (amount) actions.push('Pay Invoice')
  if (!actions.length) actions.push('Mark Done')

  return { company, date, time, amount, actions: [...new Set(actions)] }
}

type Summary = Pick<EmailAnalysis, 'summary' | 'highlights'>

function heuristicSummary(subject: string, body: string): Summary {
  const clean = body.replace(/\s+/g, ' ').trim()
  const firstSentence = clean.match(/^.{30,240}?[.!?](\s|$)/)?.[0]?.trim()
  return {
    summary: firstSentence || clean.slice(0, 220) || subject,
    highlights: [],
  }
}

export async function summarizeEmail(input: {
  subject: string
  body: string
  sender: string
}): Promise<Summary> {
  const key = process.env.GROQ_API_KEY
  if (!key) return heuristicSummary(input.subject, input.body)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Summarize one email for a busy reader. Return ONLY JSON: {summary, highlights}. summary is 2-3 plain sentences describing what the sender wants and any deadline or amount. highlights is 0-4 short strings, each a concrete fact (who, what, when, how much). No markdown, no preamble.',
          },
          {
            role: 'user',
            content: `Sender: ${input.sender}\nSubject: ${input.subject}\n\n${input.body.slice(0, 4000)}`,
          },
        ],
      }),
    })

    if (!res.ok) return heuristicSummary(input.subject, input.body)
    const data = await res.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    if (!summary) return heuristicSummary(input.subject, input.body)
    return {
      summary,
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.filter((h: unknown): h is string => typeof h === 'string').slice(0, 4)
        : [],
    }
  } catch {
    return heuristicSummary(input.subject, input.body)
  }
}

export async function extractActions(input: {
  subject: string
  body: string
  sender: string
}): Promise<GroqResult> {
  const key = process.env.GROQ_API_KEY
  if (!key) return heuristic(input.subject, input.body, input.sender)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Extract structured actions from an email. Return ONLY JSON: {company, date, time, amount, actions}. date/time/amount are strings or null. actions is a short string array like Reply, Set Reminder, Pay Invoice. No summaries.',
          },
          {
            role: 'user',
            content: `Sender: ${input.sender}\nSubject: ${input.subject}\n\n${input.body.slice(0, 2000)}`,
          },
        ],
      }),
    })

    if (!res.ok) return heuristic(input.subject, input.body, input.sender)
    const data = await res.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
    return {
      company: parsed.company || heuristic(input.subject, input.body, input.sender).company,
      date: parsed.date ?? null,
      time: parsed.time ?? null,
      amount: parsed.amount ?? null,
      actions: Array.isArray(parsed.actions) ? parsed.actions : ['Reply'],
    }
  } catch {
    return heuristic(input.subject, input.body, input.sender)
  }
}
