'use client'

import { Bell, Check, Reply } from 'lucide-react'
import { useMailos } from '@/components/mailos-provider'
import { formatReceived, initials } from '@/lib/utils'
import { categoryTone, priorityLabel } from '@/lib/priority'

export function EmailDetailView({ id }: { id: string }) {
  const { emails, completed, toggleDone } = useMailos()
  const email = emails.find((item) => item.id === id)

  if (!email) {
    return <p className="text-sm text-black/45">This email is not in the current processed inbox.</p>
  }

  const tone = categoryTone(email.jev.category)
  const priority = priorityLabel(email.jev.priority)
  const done = completed.includes(email.id)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <article className="rounded-2xl border border-black/8 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className={`grid size-10 place-items-center rounded-full text-[11px] font-semibold ${tone.avatar}`}>
            {initials(email.sender)}
          </div>
          <div>
            <div className="text-[15px] font-semibold">{email.sender}</div>
            <div className="text-[12px] text-black/40">{email.senderEmail}</div>
          </div>
          <div className="ml-auto text-[12px] text-black/35">{formatReceived(email.receivedAt)}</div>
        </div>
        <h2 className="mt-6 text-[22px] font-semibold tracking-[-0.04em]">{email.subject}</h2>
        <pre className="mt-6 whitespace-pre-wrap font-sans text-[14px] leading-6 text-black/70">{email.body}</pre>
      </article>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">AI insights</p>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-black/40">Category</dt>
              <dd className="font-semibold">{email.jev.category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Priority</dt>
              <dd className="font-semibold">
                {priority.emoji} {email.jev.priority}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Needs reply</dt>
              <dd className="font-semibold">{email.jev.needs_reply ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Calendar</dt>
              <dd className="font-semibold">{email.jev.calendar ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Confidence</dt>
              <dd className="font-semibold">{Math.round(email.jev.confidence * 100)}%</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-[#171717] p-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d9f99d]">Suggested actions</p>
          <div className="mt-4 flex flex-col gap-2">
            {(email.groq.actions.length ? email.groq.actions : ['Reply', 'Add Reminder', 'Mark Done']).map((action) => (
              <button
                key={action}
                onClick={() => action === 'Mark Done' && toggleDone(email.id)}
                className="flex items-center gap-2 rounded-lg bg-white/8 px-3 py-2.5 text-left text-[13px] font-medium hover:bg-white/12"
              >
                {action === 'Reply' ? (
                  <Reply className="size-3.5 text-[#d9f99d]" />
                ) : action.toLowerCase().includes('remind') ? (
                  <Bell className="size-3.5 text-[#d9f99d]" />
                ) : (
                  <Check className="size-3.5 text-[#d9f99d]" />
                )}
                {action}
                {action === 'Mark Done' && done ? ' ✓' : ''}
              </button>
            ))}
          </div>
          {(email.groq.date || email.groq.time || email.groq.amount) && (
            <p className="mt-4 text-[12px] text-white/45">
              {[email.groq.company, email.groq.date, email.groq.time, email.groq.amount].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
