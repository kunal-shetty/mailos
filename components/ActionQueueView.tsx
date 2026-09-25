'use client'

import { ActionCard } from '@/components/ActionCard'
import { useMailos } from '@/components/mailos-provider'

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

const IGNORED = new Set(['SPAM', 'OTHER'])

export function ActionQueueView() {
  const { emails, completed, toggleDone } = useMailos()
  const queue = emails
    .filter((email) => !IGNORED.has(email.jev.category))
    .sort((a, b) => {
      const rank = (PRIORITY_ORDER[a.jev.priority] ?? 3) - (PRIORITY_ORDER[b.jev.priority] ?? 3)
      if (rank !== 0) return rank
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    })

  if (!queue.length) {
    return (
      <p className="mx-auto max-w-3xl rounded-xl border border-dashed border-black/12 bg-white/60 px-4 py-8 text-center text-[13px] text-black/40">
        Nothing queued yet. Process your inbox to route it with Jev.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {queue.map((email) => (
        <ActionCard
          key={email.id}
          email={email}
          done={completed.includes(email.id)}
          onToggle={() => toggleDone(email.id)}
        />
      ))}
    </div>
  )
}
