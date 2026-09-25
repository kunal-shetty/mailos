// Category names are user-configurable (see lib/categories.ts), so this is
export type Category = string

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

export type JevResult = {
  category: Category
  priority: Priority
  needs_reply: boolean
  calendar: boolean
  confidence: number
}

export type GroqResult = {
  company: string
  date: string | null
  time: string | null
  amount: string | null
  actions: string[]
}

export type MailEmail = {
  id: string
  subject: string
  sender: string
  senderEmail: string
  snippet: string
  body: string
  bodyHtml: string | null
  receivedAt: string
  unread: boolean
  jev: JevResult
  groq: GroqResult
}

export type EmailAnalysis = {
  jev: JevResult
  groq: GroqResult
  summary: string
  highlights: string[]
}

export type SessionUser = {
  mode: 'google'
  email: string
  name: string
  picture?: string
  accessToken?: string
}

export type DashboardStats = {
  unread: number
  recruiters: number
  interviews: number
  invoices: string
  followUps: number
}
