'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Command } from 'lucide-react'

const EMAIL_CARDS = [
  {
    initials: 'PR', tag: 'RECRUITER', from: 'Priya Nair · Amazon',
    subject: 'Still interested in the SDE role?',
    avatarBg: 'bg-lime-400/15', avatarText: 'text-lime-300',
    tagBg: 'bg-lime-400/10', tagText: 'text-lime-300',
    float: { y: [0, -3, 0], rotate: 3.1 }, delay: 0.6,
  },
  {
    initials: 'AW', tag: 'INVOICE', from: 'AWS Billing',
    subject: 'Invoice ₹12,000 due in 24 hrs',
    avatarBg: 'bg-yellow-300/15', avatarText: 'text-yellow-300',
    tagBg: 'bg-yellow-300/10', tagText: 'text-yellow-300',
    float: { y: [0, -5, 0], rotate: 1.3 }, delay: 0.3,
  },
  {
    initials: 'SC', tag: 'INTERVIEW', from: 'Sarah Chen · Google',
    subject: 'Interview confirmed for tomorrow 3 PM',
    avatarBg: 'bg-red-300/15', avatarText: 'text-red-300',
    tagBg: 'bg-red-300/10', tagText: 'text-red-300',
    float: { y: [0, -8, 0], rotate: -2.2 }, delay: 0,
    progress: true,
  },
]

const FEATURES = [
  { title: 'Gmail, read-only',        body: 'Connects via OAuth with the narrowest scope — read only, never sends or deletes.' },
  { title: 'Deterministic routing',   body: 'Jev classifies each message into a category you control — Interview, Invoice, Recruiter, and more.' },
  { title: 'Action extraction',       body: 'Groq pulls company, date, amount, and a short action list from every message body.' },
  { title: 'Priority dashboard',      body: 'Unread, recruiter, interview, invoice, and follow-up counts at a glance, color-coded by tone.' },
  { title: 'Offline fallback',        body: 'Missing API keys? MailOS drops to keyword heuristics — the app never breaks mid-session.' },
  { title: 'Optional persistence',    body: 'Supabase stores your processed inbox. Skip it and everything lives in localStorage — your call.' },
]

const STEPS = [
  { label: '01 — FETCH',    title: 'Gmail pull',          desc: 'Latest inbox messages arrive via Gmail REST, with MIME and HTML bodies parsed and cleaned.' },
  { label: '02 — CLASSIFY', title: 'Jev routes it',        desc: "TypeSafe's deterministic classifier assigns a category. No hallucination — just signal." },
  { label: '03 — EXTRACT',  title: 'Groq finds the action', desc: 'llama-3.1-8b-instant reads the body and returns company, date, amount, and 2–3 action bullets.' },
  { label: '04 — SURFACE',  title: 'You see what matters', desc: 'The action queue surfaces priority emails sorted by category tone. Interviews before newsletters. Always.' },
  { label: '05 — PERSIST',  title: 'Store or skip',        desc: 'Processed results go to Supabase if configured. Otherwise they live in client-side state until next session.' },
]

export default function LandingPage() {
  const gridRef = useRef<HTMLDivElement>(null)

  // subtle mouse parallax on the grid
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!gridRef.current || window.innerWidth < 700) return
      const x = (e.clientX / window.innerWidth - 0.5) * 14
      const y = (e.clientY / window.innerHeight - 0.5) * 10
      gridRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div className="bg-[#f7f7f4] text-[#171717] overflow-x-hidden font-sans antialiased">

      {/* ── HERO ── */}
      <section className="relative min-h-screen bg-[#0c0c0a] flex flex-col overflow-hidden">

        {/* grid */}
        <div
          ref={gridRef}
          className="pointer-events-none absolute inset-0 transition-transform duration-100 ease-out"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)',
          }}
        />

        {/* lime glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[700px] h-[500px] rounded-full bg-lime-300/5 blur-3xl" />

        {/* header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 flex items-center justify-between px-10 py-6"
        >
          <div className="flex items-center gap-2.5">
            <div className="grid size-[30px] place-items-center rounded-[8px] bg-lime-300 text-[#171717]">
              <Command size={15} strokeWidth={2.2} />
            </div>
            <span className="text-[16px] font-semibold tracking-[-0.04em] text-white">MailOS</span>
          </div>
          <Link href="/dashboard" className="rounded-lg bg-white/8 border border-white/10 px-4 py-2 text-[12px] font-semibold text-white hover:bg-white/13 transition-colors">
            Open dashboard
          </Link>
        </motion.header>

        {/* hero body */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center px-6 pb-20 pt-10">

          {/* status pill */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-5 flex items-center gap-2 font-mono text-[10px] text-white/25 tracking-wider"
          >
            <span className="size-1.5 rounded-full bg-lime-300 animate-pulse" />
            system nominal · inbox connected · 3 actions queued
          </motion.div>

          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-8 flex items-center gap-2 font-mono text-[10px] text-lime-300 tracking-[0.12em]"
          >
            <span className="size-1.5 rounded-full bg-lime-300 animate-pulse" />
            mailos — inbox runtime
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-[clamp(44px,8vw,76px)] font-semibold leading-[1.02] tracking-[-0.06em] text-white max-w-3xl"
          >
            Your inbox is an<br />
            <span className="text-lime-300">operating system.</span>
          </motion.h1>

          {/* sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 max-w-md text-[16px] leading-[1.7] text-white/40"
          >
            Jev routes every message. Groq extracts what needs doing.
            You stop living in folders.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="mt-9 flex items-center gap-4"
          >
            <a
              href="/api/auth/google"
              className="inline-flex items-center gap-2 rounded-[10px] bg-lime-300 px-5 py-3.5 text-[13px] font-bold text-[#171717] tracking-[-0.02em] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(217,249,157,0.3)]"
            >
              Connect Gmail
            </a>
            <a href="#how" className="font-mono text-[11px] text-white/35 tracking-wider hover:text-white/60 transition-colors">
              see how it works ↓
            </a>
          </motion.div>

          {/* floating cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="relative mt-16 w-[400px] max-w-full h-[210px]"
            style={{ perspective: '1200px' }}
          >
            {EMAIL_CARDS.map((card, i) => (
              <motion.div
                key={card.tag}
                className="absolute inset-x-0 rounded-2xl border border-white/10 p-[18px] backdrop-blur-md"
                style={{
                  top: i === 0 ? 44 : i === 1 ? 22 : 0,
                  zIndex: 3 - i,
                  background: i === 2 ? 'rgba(255,255,255,0.065)' : i === 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)',
                }}
                animate={{ y: card.float.y, rotate: card.float.rotate }}
                transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
              >
                <div className="flex items-center justify-between">
                  <div className={`grid size-[34px] place-items-center rounded-full text-[11px] font-bold tracking-wider ${card.avatarBg} ${card.avatarText}`}>
                    {card.initials}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 font-mono text-[9px] tracking-widest ${card.tagBg} ${card.tagText}`}>
                    {card.tag}
                  </span>
                </div>
                <div className="mt-3.5 text-[11px] text-white/36">{card.from}</div>
                <div className="mt-1 text-[14px] font-semibold tracking-[-0.03em] text-white/90 leading-snug">{card.subject}</div>
                {card.progress && (
                  <div className="mt-3.5 h-[2px] rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-red-300 to-red-400"
                      initial={{ width: 0 }}
                      animate={{ width: '72%' }}
                      transition={{ duration: 2, delay: 1.8, ease: 'easeOut' }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-[#f7f7f4] px-10 py-24" id="how">
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 font-mono text-[10px] tracking-widest text-black/30">What it does</p>
          <h2 className="mb-16 text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.05em] leading-[1.1] max-w-md">
            Reads, routes,<br />extracts, surfaces.
          </h2>

          <div className="grid grid-cols-3 gap-0.5 max-sm:grid-cols-1">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className={`group bg-[#f0f0ec] p-8 hover:bg-[#e8e8e4] transition-colors duration-200 ${
                  i === 0 ? 'rounded-tl-2xl' :
                  i === 2 ? 'rounded-tr-2xl' :
                  i === 3 ? 'rounded-bl-2xl' :
                  i === 5 ? 'rounded-br-2xl' : ''
                }`}
              >
                <div className="mb-5 grid size-9 place-items-center rounded-[10px] bg-[#171717] text-lime-300">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                  </svg>
                </div>
                <div className="mb-2 text-[14px] font-semibold tracking-[-0.03em]">{feat.title}</div>
                <p className="text-[13px] leading-[1.65] text-black/50">{feat.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIPELINE ── */}
      <section className="relative overflow-hidden bg-[#0c0c0a] px-10 py-24">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="mb-14 text-[clamp(28px,4vw,38px)] font-semibold tracking-[-0.05em] text-white leading-[1.15]">
            How a message goes from<br />
            <span className="text-white/22">raw MIME to action item.</span>
          </h2>

          <div className="flex flex-col">
            {STEPS.map((step, i) => (
              <div key={step.label} className="grid grid-cols-[48px_1fr] gap-x-5">
                <div className="flex flex-col items-center">
                  <div className="mt-1 size-2.5 shrink-0 rounded-full bg-lime-300 shadow-[0_0_0_4px_rgba(217,249,157,0.12)]" />
                  {i < STEPS.length - 1 && (
                    <div className="my-1.5 w-px flex-1 bg-gradient-to-b from-lime-300/30 to-lime-300/5" />
                  )}
                </div>
                <div className="pb-10">
                  <div className="mb-1.5 font-mono text-[10px] tracking-wider text-lime-300">{step.label}</div>
                  <div className="mb-1.5 text-[16px] font-semibold tracking-[-0.03em] text-white">{step.title}</div>
                  <p className="max-w-lg text-[13px] leading-relaxed text-white/38">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="bg-[#f7f7f4] px-10 py-24 text-center">
        <h2 className="mx-auto mb-6 max-w-xl text-[clamp(36px,6vw,60px)] font-semibold tracking-[-0.06em] leading-[1.05]">
          Stop living<br />in folders.
        </h2>
        <p className="mb-8 font-mono text-[12px] text-black/35">read-only · no email sent · open source</p>
        <a
          href="/api/auth/google"
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#171717] px-6 py-3.5 text-[13px] font-bold text-white tracking-[-0.02em] transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Connect Gmail — it&apos;s free
        </a>

        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {['GitHub', 'Documentation', 'MIT License', '@kunal_shetty'].map((link) => (
            <a key={link} href="#" className="font-mono text-[11px] text-black/30 hover:text-black/60 transition-colors">
              {link}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}