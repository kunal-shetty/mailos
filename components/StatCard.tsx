import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  meta,
  icon: Icon,
  warn,
}: {
  label: string
  value: string | number
  meta: string
  icon: LucideIcon
  warn?: boolean
}) {
  return (
    <div className="rounded-xl border border-black/8 bg-white p-4 sm:p-5">
      <div className="mb-6 flex items-start justify-between">
        <span className="text-[11px] font-medium text-black/40">{label}</span>
        <Icon className="size-4 text-black/25" />
      </div>
      <div className="text-[23px] font-semibold tracking-[-0.045em]">{value}</div>
      <div className={cn('mt-1 text-[11px]', warn ? 'text-[#c77b58]' : 'text-black/35')}>{meta}</div>
    </div>
  )
}
