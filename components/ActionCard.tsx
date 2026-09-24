'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { actionHeadline, categoryTone, priorityLabel } from '@/lib/priority'
import { cn } from '@/lib/utils'
import type { MailEmail } from '@/types'

export function ActionCard({
  email,
  done,
  onToggle,
}: {
  email: MailEmail
  done?: boolean
  onToggle?: () => void
}) {
  const tone = categoryTone(email.jev.category)
  const priority = priorityLabel(email.jev.priority)
  const headline = actionHeadline(email)

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-4', tone.card, done && 'opacity-55')}>
      <span className={cn('size-2.5 shrink-0 rounded-full', tone.dot)} />
      <Link href={`/email/${email.id}`} className="min-w-0 flex-1">
        <div className={cn('text-[14px] font-semibold tracking-[-0.02em]', done && 'line-through')}>
          {headline.title}
        </div>
        <div className="mt-1 text-[12px] text-black/45">{headline.detail}</div>
      </Link>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-[11px] font-medium text-black/50">
          {priority.emoji} {email.jev.category.replace('_', ' ')}
        </span>
        {onToggle && (
          <button
            onClick={onToggle}
            className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] font-semibold text-black/55 hover:text-black"
          >
            {done ? <Check className="size-3.5 text-[#65a30d]" /> : 'Mark done'}
          </button>
        )}
      </div>
    </div>
  )
}
