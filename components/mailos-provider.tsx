'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_CATEGORIES, sanitizeCategories, type CategoryDef } from '@/lib/categories'
import type { DashboardStats, MailEmail } from '@/types'

type MailosContextValue = {
  emails: MailEmail[]
  stats: DashboardStats
  processed: boolean
  processing: boolean
  error: string | null
  completed: string[]
  source: 'gmail'
  categories: CategoryDef[]
  saveCategories: (next: CategoryDef[]) => void
  processInbox: (categories?: CategoryDef[]) => Promise<void>
  toggleDone: (id: string) => void
}

const MailosContext = createContext<MailosContextValue | null>(null)

const STORAGE_KEY = 'mailos-inbox-v2'
const CATEGORIES_KEY = 'mailos-categories'

const EMPTY_STATS: DashboardStats = {
  unread: 0,
  recruiters: 0,
  interviews: 0,
  invoices: '₹0',
  followUps: 0,
}

export function MailosProvider({ children }: { children: React.ReactNode }) {
  const [emails, setEmails] = useState<MailEmail[]>([])
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [processed, setProcessed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryDef[]>(DEFAULT_CATEGORIES)
  const processingRef = useRef(false)
  const categoriesRef = useRef(categories)

  useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  const processInbox = useCallback(async (override?: CategoryDef[]) => {
    if (processingRef.current) return
    processingRef.current = true
    setProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ categories: override ?? categoriesRef.current }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not process your inbox.')
        return
      }
      setEmails(Array.isArray(data.emails) ? data.emails : [])
      setStats(data.stats ?? EMPTY_STATS)
      setProcessed(true)
    } catch {
      setError('Could not reach the server.')
    } finally {
      processingRef.current = false
      setProcessing(false)
    }
  }, [])

  // Restore saved categories and any previously processed inbox, then pull the
  // real Gmail inbox once when there is nothing cached.
  useEffect(() => {
    let hydrated = false
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_KEY)
      if (savedCategories) setCategories(sanitizeCategories(JSON.parse(savedCategories)))
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.emails) && parsed.emails.length) {
          setEmails(parsed.emails)
          hydrated = true
        }
        if (parsed.stats) setStats(parsed.stats)
        if (parsed.processed) setProcessed(true)
        if (Array.isArray(parsed.completed)) setCompleted(parsed.completed)
      }
    } catch {
      /* ignore */
    }

    if (!hydrated) void processInbox()
  }, [processInbox])

  useEffect(() => {
    if (!processed) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ emails, stats, processed, completed }),
    )
  }, [emails, stats, processed, completed])

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }, [categories])

  const toggleDone = useCallback((id: string) => {
    setCompleted((items) => (items.includes(id) ? items.filter((x) => x !== id) : [...items, id]))
  }, [])

  const saveCategories = useCallback((next: CategoryDef[]) => {
    setCategories(sanitizeCategories(next))
  }, [])

  const value = useMemo(
    () =>
      ({
        emails,
        stats,
        processed,
        processing,
        error,
        completed,
        source: 'gmail',
        categories,
        saveCategories,
        processInbox,
        toggleDone,
      }) satisfies MailosContextValue,
    [
      emails,
      stats,
      processed,
      processing,
      error,
      completed,
      categories,
      saveCategories,
      processInbox,
      toggleDone,
    ],
  )

  return <MailosContext.Provider value={value}>{children}</MailosContext.Provider>
}

export function useMailos() {
  const ctx = useContext(MailosContext)
  if (!ctx) throw new Error('useMailos must be inside MailosProvider')
  return ctx
}
