'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { demoEmails, demoStats } from '@/lib/demo-data'
import type { DashboardStats, MailEmail } from '@/types'

type MailosContextValue = {
  emails: MailEmail[]
  stats: DashboardStats
  processed: boolean
  processing: boolean
  completed: string[]
  source: 'demo' | 'gmail'
  processInbox: () => Promise<void>
  toggleDone: (id: string) => void
}

const MailosContext = createContext<MailosContextValue | null>(null)

const STORAGE_KEY = 'mailos-inbox'

export function MailosProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<MailEmail[]>(demoEmails)
  const [stats, setStats] = useState<DashboardStats>(demoStats)
  const [processed, setProcessed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [source, setSource] = useState<'demo' | 'gmail'>('demo')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.emails?.length) setEmails(parsed.emails)
      if (parsed.stats) setStats(parsed.stats)
      if (parsed.processed) setProcessed(true)
      if (parsed.source) setSource(parsed.source)
      if (parsed.completed) setCompleted(parsed.completed)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ emails, stats, processed, source, completed }),
    )
  }, [emails, stats, processed, source, completed])

  const processInbox = useCallback(async () => {
    if (processing) return
    setProcessing(true)
    try {
      const res = await fetch('/api/process', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setEmails(data.emails)
        setStats(data.stats)
        setSource(data.source)
      }
      setProcessed(true)
    } finally {
      setProcessing(false)
    }
  }, [processing])

  const toggleDone = useCallback((id: string) => {
    setCompleted((items) => (items.includes(id) ? items.filter((x) => x !== id) : [...items, id]))
  }, [])

  const value = useMemo(
    () => ({ emails, stats, processed, processing, completed, source, processInbox, toggleDone }),
    [emails, stats, processed, processing, completed, source, processInbox, toggleDone],
  )

  return <MailosContext.Provider value={value}>{children}</MailosContext.Provider>
}

export function useMailos() {
  const ctx = useContext(MailosContext)
  if (!ctx) throw new Error('useMailos must be inside MailosProvider')
  return ctx
}
