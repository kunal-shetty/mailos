import type { GroqResult } from '@/types'

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
