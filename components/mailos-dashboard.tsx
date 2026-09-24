'use client'

import { useState } from 'react'
import {
  Archive,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Command,
  FileText,
  Inbox,
  Layers3,
  Menu,
  MoreHorizontal,
  Paperclip,
  Plus,
  Reply,
  Search,
  Settings2,
  Sparkles,
  Tag,
  Users,
  X,
  Zap,
} from 'lucide-react'

const actions = [
  { title: 'Reply to Google recruiter', detail: 'Sarah Chen · 2 hours ago', label: 'Reply today', tone: 'lime', icon: Reply },
  { title: 'Pay AWS invoice', detail: 'AWS Billing · Due tomorrow', label: '₹12,000', tone: 'amber', icon: CircleDollarSign },
  { title: 'Interview tomorrow at 3 PM', detail: 'Google · Calendar event detected', label: 'High priority', tone: 'rose', icon: CalendarDays },
  { title: 'Follow up with Linear', detail: 'No response in 5 days', label: 'Overdue', tone: 'violet', icon: Clock3 },
]

const emails = [
  { sender: 'Sarah Chen', company: 'Google', subject: 'Next steps — Software Engineer Interview', snippet: 'Can you join us tomorrow at 3 PM for a technical conversation?', time: '10:42 AM', category: 'INTERVIEW', color: 'bg-[#d9f99d]', initials: 'SC' },
  { sender: 'AWS Billing', company: 'Amazon Web Services', subject: 'Your AWS invoice is ready', snippet: 'Your invoice for September is ready to view and download.', time: '9:18 AM', category: 'INVOICE', color: 'bg-[#fde68a]', initials: 'AW' },
  { sender: 'Maya Patel', company: 'Linear', subject: 'Re: Product design exercise', snippet: 'Just checking in on this — happy to answer any questions.', time: 'Yesterday', category: 'FOLLOW-UP', color: 'bg-[#ddd6fe]', initials: 'MP' },
  { sender: 'Campus Careers', company: 'University', subject: 'Fall career fair registration', snippet: 'Reserve your spot for the engineering and product fair.', time: 'Yesterday', category: 'OPPORTUNITY', color: 'bg-[#bfdbfe]', initials: 'CC' },
]

const navItems = [
  { label: 'Overview', icon: Layers3 },
  { label: 'Action queue', icon: Zap, count: '9' },
  { label: 'Inbox', icon: Inbox, count: '247' },
]

const spaces = [
  { label: 'Recruiters', icon: Users },
  { label: 'Finance', icon: CircleDollarSign },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Follow-ups', icon: Clock3 },
]

export function MailosDashboard() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [selectedEmail, setSelectedEmail] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  const processInbox = () => {
    if (processing) return
    setProcessing(true)
    window.setTimeout(() => {
      setProcessing(false)
      setProcessed(true)
    }, 1600)
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className={`${mobileNav ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-20 w-[260px] flex-col border-r border-black/8 bg-[#f7f7f4] px-5 py-5 md:relative md:flex`}>
          <div className="mb-10 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-[8px] bg-[#171717] text-[#d9f99d]"><Command className="size-4" /></div>
              <span className="text-[17px] font-semibold tracking-[-0.04em]">MailOS</span>
            </div>
            <button onClick={() => setMobileNav(false)} className="rounded-md p-1 text-black/50 md:hidden" aria-label="Close navigation"><X className="size-4" /></button>
          </div>
          <div className="mb-5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">Workspace</div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return <button key={item.label} onClick={() => { setActiveNav(item.label); setMobileNav(false) }} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${activeNav === item.label ? 'bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,.04)]' : 'text-black/50 hover:bg-white/60 hover:text-black'}`}><span className="flex items-center gap-3"><Icon className="size-[16px]" />{item.label}</span>{item.count && <span className="text-[11px] text-black/35">{item.count}</span>}</button>
            })}
          </nav>
          <div className="mb-5 mt-9 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">Spaces</div>
          <nav className="flex flex-col gap-1">
            {spaces.map((item) => { const Icon = item.icon; return <button key={item.label} onClick={() => setActiveNav(item.label)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium ${activeNav === item.label ? 'bg-white text-black' : 'text-black/50 hover:bg-white/60 hover:text-black'}`}><Icon className="size-[16px]" />{item.label}</button> })}
          </nav>
          <div className="mt-auto rounded-xl border border-black/8 bg-white/65 p-3.5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold"><div className="grid size-6 place-items-center rounded-full bg-[#e3f6bc] text-[10px]">JD</div> Jordan Davis <ChevronDown className="ml-auto size-3.5 text-black/35" /></div>
            <div className="flex items-center justify-between text-[11px] text-black/40"><span>Inbox health</span><span className="font-medium text-[#5e8b27]">Good</span></div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/8"><div className="h-full w-[78%] rounded-full bg-[#a6d65a]" /></div>
          </div>
        </aside>
        <section className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-8">
          <header className="mb-9 flex items-center justify-between">
            <button onClick={() => setMobileNav(true)} className="rounded-lg border border-black/10 bg-white p-2 md:hidden" aria-label="Open navigation"><Menu className="size-4" /></button>
            <div className="hidden items-center gap-2 text-[12px] text-black/35 md:flex"><span>Wednesday, September 24, 2026</span><span className="size-1 rounded-full bg-black/20" /><span className="flex items-center gap-1 text-[#62932d]"><span className="size-1.5 rounded-full bg-[#8bc34f]" /> All systems operational</span></div>
            <div className="ml-auto flex items-center gap-2"><button className="hidden items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12px] text-black/45 sm:flex"><Search className="size-3.5" /> Search <kbd className="ml-2 rounded border border-black/10 px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button><button className="rounded-lg border border-black/10 bg-white p-2 text-black/55" aria-label="Notifications"><Bell className="size-4" /></button><button className="rounded-lg border border-black/10 bg-white p-2 text-black/55" aria-label="Settings"><Settings2 className="size-4" /></button></div>
          </header>
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">Overview / {activeNav}</p><h1 className="text-[32px] font-semibold tracking-[-0.055em] sm:text-[40px]">Good morning, Jordan<span className="text-[#8dbd4a]">.</span></h1><p className="mt-2 text-[14px] text-black/45">Here&apos;s what your inbox is asking for today.</p></div>
            <button onClick={processInbox} disabled={processing} className="group flex items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 py-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-wait disabled:opacity-80"><Sparkles className={`size-3.5 text-[#d9f99d] ${processing ? 'animate-spin' : 'group-hover:rotate-12'}`} />{processing ? 'Processing inbox...' : processed ? 'Inbox processed' : 'Process inbox'}<ArrowUpRight className="size-3.5 text-white/45" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[['247','Unread','+12 today',Inbox],['8','Recruiters','3 need reply',Users],['3','Interviews','Next: tomorrow',CalendarDays],['₹18,400','Invoices','₹12k due soon',CircleDollarSign],['12','Follow-ups','4 overdue',Clock3]].map(([value,label,meta,Icon], i) => <div key={label as string} className="rounded-xl border border-black/8 bg-white p-4 sm:p-5"><div className="mb-6 flex items-start justify-between"><span className="text-[11px] font-medium text-black/40">{label as string}</span><Icon className="size-4 text-black/25" /></div><div className="text-[23px] font-semibold tracking-[-0.045em]">{value as string}</div><div className={`mt-1 text-[11px] ${i === 0 || i === 4 ? 'text-[#c77b58]' : 'text-black/35'}`}>{meta as string}</div></div>)}
          </div>
          <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_1fr]">
            <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold tracking-[-0.02em]">Today&apos;s action queue</h2><p className="mt-1 text-[12px] text-black/40">The things worth your attention.</p></div><button onClick={() => setActiveNav('Action queue')} className="text-[12px] font-medium text-black/45 hover:text-black">View all <ArrowUpRight className="ml-1 inline size-3" /></button></div><div className="flex flex-col gap-2">{actions.map((action) => { const Icon = action.icon; return <button key={action.title} className="group flex items-center gap-3 rounded-xl border border-black/8 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,.05)]"><div className={`grid size-9 place-items-center rounded-lg ${action.tone === 'lime' ? 'bg-[#e9f9c9] text-[#6c9b2d]' : action.tone === 'amber' ? 'bg-[#fff4d4] text-[#be8c29]' : action.tone === 'rose' ? 'bg-[#ffe4dd] text-[#c56b53]' : 'bg-[#eee9ff] text-[#8d76cf]'}`}><Icon className="size-4" /></div><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{action.title}</div><div className="mt-1 truncate text-[11px] text-black/38">{action.detail}</div></div><span className="hidden rounded-full bg-[#f4f4f0] px-2 py-1 text-[10px] font-medium text-black/45 sm:block">{action.label}</span><ArrowUpRight className="size-4 text-black/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></button> })}</div></section>
            <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold tracking-[-0.02em]">Recent emails</h2><p className="mt-1 text-[12px] text-black/40">Sorted by what matters next.</p></div><button className="rounded-md p-1.5 text-black/35 hover:bg-white hover:text-black" aria-label="More options"><MoreHorizontal className="size-4" /></button></div><div className="overflow-hidden rounded-xl border border-black/8 bg-white">{emails.map((email, index) => <button key={email.subject} onClick={() => setSelectedEmail(index)} className={`flex w-full items-start gap-3 border-b border-black/6 p-3.5 text-left last:border-0 ${selectedEmail === index ? 'bg-[#fbfff3]' : 'hover:bg-[#fafaf7]'}`}><div className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${email.color}`}>{email.initials}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-[12px] font-semibold">{email.sender}</span><span className="shrink-0 text-[10px] text-black/30">{email.time}</span></div><div className="mt-1 truncate text-[12px] font-medium text-black/75">{email.subject}</div><div className="mt-1 truncate text-[11px] text-black/35">{email.snippet}</div></div><span className="hidden rounded-full border border-black/8 px-2 py-1 text-[9px] font-semibold tracking-wide text-black/40 lg:block">{email.category}</span></button>)}</div></section>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.35fr]"><div className="rounded-xl bg-[#171717] p-5 text-white sm:p-6"><div className="flex items-start justify-between"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d9f99d]"><Sparkles className="size-3" /> Intelligence layer</div><h3 className="max-w-[250px] text-[20px] font-semibold leading-tight tracking-[-0.04em]">Every email routed to its next best action.</h3></div><div className="grid size-9 place-items-center rounded-lg bg-white/10"><Zap className="size-4 text-[#d9f99d]" /></div></div><div className="mt-7 flex items-center gap-2 text-[11px] text-white/45"><span className="size-1.5 rounded-full bg-[#d9f99d]" /> Jev classification <span className="mx-1 text-white/20">→</span> Groq extraction</div></div><div className="rounded-xl border border-black/8 bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-[15px] font-semibold">Inbox activity</h3><p className="mt-1 text-[12px] text-black/40">The last 7 days</p></div><span className="rounded-full bg-[#eef9dc] px-2 py-1 text-[10px] font-semibold text-[#6d972f]">+18.4%</span></div><div className="flex h-[74px] items-end gap-2">{[32,45,38,61,48,71,84,55,66,76,62,92,78,88,70,96,82,100].map((height, i) => <div key={i} className={`flex-1 rounded-sm ${i === 17 ? 'bg-[#94c44e]' : 'bg-[#dcebc0]'}`} style={{ height: `${height}%` }} />)}</div><div className="mt-3 flex justify-between text-[10px] text-black/30"><span>Sep 18</span><span>Today</span></div></div></div>
        </section>
      </div>
      {selectedEmail !== null && <div className="hidden" aria-hidden="true"><Paperclip /><Tag /><Archive /><FileText /><Plus /></div>}
    </main>
  )
}

export default MailosDashboard
