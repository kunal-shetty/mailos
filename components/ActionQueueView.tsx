'use client'

import { ActionCard } from '@/components/ActionCard'
import { useMailos } from '@/components/mailos-provider'

const ORDER = ['INTERVIEW', 'RECRUITER', 'INVOICE', 'FOLLOW_UP'] as const

export function ActionQueueView() {
  const { emails, completed, toggleDone } = useMailos()
  const queue = emails
    .filter((e) => ORDER.includes(e.jev.category as (typeof ORDER)[number]))
    .sort(
      (a, b) =>
        ORDER.indexOf(a.jev.category as (typeof ORDER)[number]) -
        ORDER.indexOf(b.jev.category as (typeof ORDER)[number]),
    )

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
