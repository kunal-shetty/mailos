import Link from 'next/link'
import { formatReceived, initials } from '@/lib/utils'
import type { MailEmail } from '@/types'
import { categoryTone } from '@/lib/priority'

export function EmailCard({ email }: { email: MailEmail }) {
  const tone = categoryTone(email.jev.category)
  return (
    <Link
      href={`/email/${email.id}`}
      className="flex w-full items-start gap-3 border-b border-black/6 p-3.5 text-left last:border-0 hover:bg-[#fafaf7]"
    >
      <div className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${tone.avatar}`}>
        {initials(email.sender)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className={`truncate text-[12px] ${email.unread ? 'font-semibold' : 'font-medium'}`}>
            {email.sender}
          </span>
          <span className="shrink-0 text-[10px] text-black/30">{formatReceived(email.receivedAt)}</span>
        </div>
        <div className="mt-1 truncate text-[12px] font-medium text-black/75">{email.subject}</div>
        <div className="mt-1 truncate text-[11px] text-black/35">{email.snippet}</div>
      </div>
      <span className="hidden rounded-full border border-black/8 px-2 py-1 text-[9px] font-semibold tracking-wide text-black/40 lg:block">
        {email.jev.category}
      </span>
    </Link>
  )
}
