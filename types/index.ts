export type Category =
  | 'INTERVIEW'
  | 'RECRUITER'
  | 'INVOICE'
  | 'FOLLOW_UP'
  | 'SPAM'
  | 'OTHER'

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
  receivedAt: string
  unread: boolean
  jev: JevResult
  groq: GroqResult
}

export type SessionUser = {
  mode: 'demo' | 'google'
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
