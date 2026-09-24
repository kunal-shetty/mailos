'use client'

import { CalendarDays, CircleDollarSign, Clock3, Inbox, Users } from 'lucide-react'
import { ActionCard } from '@/components/ActionCard'
import { EmailCard } from '@/components/EmailCard'
import { ProcessButton } from '@/components/ProcessButton'
import { StatCard } from '@/components/StatCard'
import { useMailos } from '@/components/mailos-provider'
import Link from 'next/link'

export function DashboardView({ firstName }: { firstName: string }) {
  const { emails, stats, processed } = useMailos()
  const recent = emails
    .filter((e) => e.jev.category !== 'SPAM' && e.jev.category !== 'OTHER')
    .slice(0, 4)

  return (
    <>
      <div className="mb-8 flex justify-end md:hidden">
        <ProcessButton />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Unread" value={stats.unread} meta="+12 today" icon={Inbox} warn />
        <StatCard label="Recruiters" value={stats.recruiters} meta="Need a reply" icon={Users} />
        <StatCard label="Interviews" value={stats.interviews} meta="Next: tomorrow" icon={CalendarDays} />
        <StatCard label="Invoices" value={stats.invoices} meta="Due soon" icon={CircleDollarSign} />
        <StatCard label="Follow-ups" value={stats.followUps} meta="Aging threads" icon={Clock3} warn />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Recent actions</h2>
              <p className="mt-1 text-[12px] text-black/40">
                {processed ? 'Extracted from this inbox.' : 'Process inbox to lock these in.'}
              </p>
            </div>
            <Link href="/actions" className="text-[12px] font-medium text-black/45 hover:text-black">
              View queue
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((email) => (
              <ActionCard key={email.id} email={email} />
            ))}
          </div>
        </section>
        <section>
          <div className="mb-4">
            <h2 className="text-[15px] font-semibold">Latest 30</h2>
            <p className="mt-1 text-[12px] text-black/40">Hey {firstName} — sorted by what matters next.</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-black/8 bg-white">
            {emails.slice(0, 8).map((email) => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
