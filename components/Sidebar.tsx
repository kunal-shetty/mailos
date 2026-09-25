'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Command, Inbox, Layers3, LogOut, Tags, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: Layers3 },
  { href: '/actions', label: 'Action queue', icon: Zap },
  { href: '/settings', label: 'Categories', icon: Tags },
]

export function Sidebar({ name }: { name: string }) {
  const pathname = usePathname()
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col border-r border-black/8 px-5 py-5 md:flex">
      <div className="mb-10 flex items-center gap-2.5 px-2">
        <div className="grid size-7 place-items-center rounded-[8px] bg-[#171717] text-[#d9f99d]">
          <Command className="size-4" />
        </div>
        <span className="text-[17px] font-semibold tracking-[-0.04em]">MailOS</span>
      </div>
      <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">
        Workspace
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium',
                active ? 'bg-white text-black shadow-[0_1px_2px_rgba(0,0,0,.04)]' : 'text-black/50 hover:bg-white/60 hover:text-black',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
        <div className="mt-6 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">
          Inbox
        </div>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-black/40">
          <Inbox className="size-4" />
          Latest 30
        </div>
      </nav>
      <div className="mt-auto rounded-xl border border-black/8 bg-white/70 p-3.5">
        <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold">
          <div className="grid size-6 place-items-center rounded-full bg-[#e3f6bc] text-[10px]">
            {initials}
          </div>
          <span className="truncate">{name}</span>
        </div>
        <a
          href="/api/auth/logout"
          className="flex items-center gap-2 text-[11px] text-black/40 hover:text-black"
        >
          <LogOut className="size-3.5" /> Sign out
        </a>
      </div>
    </aside>
  )
}
