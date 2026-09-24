import { LandingInboxCard } from '@/components/LandingInboxCard'
import { Command } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/session'

export default async function LandingPage() {
  const session = await getSession()

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-[8px] bg-[#171717] text-[#d9f99d]">
            <Command className="size-4" />
          </div>
          <span className="text-[17px] font-semibold tracking-[-0.04em]">MailOS</span>
        </div>
        {session ? (
          <Link href="/dashboard" className="rounded-lg bg-[#171717] px-3 py-2 text-[12px] font-semibold text-white">
            Open dashboard
          </Link>
        ) : (
          <span className="text-[12px] text-black/35">Your inbox is an operating system.</span>
        )}
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-10 text-center sm:pt-16">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black/35">MailOS</p>
        <h1 className="text-[44px] font-semibold leading-[1.05] tracking-[-0.06em] sm:text-[64px]">
          Your inbox is an
          <br />
          operating system.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-7 text-black/50">
          Jev routes every email. Groq extracts the action. You stop living in folders.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/api/auth/google"
            className="inline-flex items-center justify-center rounded-lg bg-[#171717] px-5 py-3 text-[13px] font-semibold text-white"
          >
            Connect Gmail
          </a>
          <a
            href="/api/auth/demo"
            className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-5 py-3 text-[13px] font-semibold text-black/70"
          >
            Preview sample inbox
          </a>
        </div>
        <div className="mt-16">
          <LandingInboxCard />
        </div>
      </section>
    </main>
  )
}
