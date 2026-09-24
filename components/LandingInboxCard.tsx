'use client'

import { motion } from 'framer-motion'

const cards = [
  { from: 'Sarah Chen · Google', subject: 'Interview tomorrow at 3 PM', tag: 'INTERVIEW', color: 'bg-[#fecaca]' },
  { from: 'AWS Billing', subject: 'Invoice ₹12,000 due tomorrow', tag: 'INVOICE', color: 'bg-[#fde68a]' },
  { from: 'Priya Nair · Amazon', subject: 'Still interested in the SDE role?', tag: 'RECRUITER', color: 'bg-[#d9f99d]' },
]

export function LandingInboxCard() {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {cards.map((card, index) => (
        <motion.div
          key={card.tag}
          className="absolute left-0 right-0 rounded-2xl border border-black/8 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
          animate={{
            y: [index * 18, index * 18 - 6, index * 18],
            rotate: index === 0 ? -2 : index === 1 ? 1.4 : 3,
            zIndex: 3 - index,
          }}
          transition={{
            y: { duration: 3.2 + index * 0.4, repeat: Infinity, ease: 'easeInOut' },
            delay: index * 0.08,
          }}
        >
          <div className="flex items-center justify-between">
            <div className={`grid size-8 place-items-center rounded-full text-[10px] font-semibold ${card.color}`}>
              {card.tag.slice(0, 2)}
            </div>
            <span className="rounded-full bg-[#f4f4f0] px-2 py-1 text-[10px] font-semibold tracking-wide text-black/45">
              {card.tag}
            </span>
          </div>
          <div className="mt-3 text-[12px] text-black/40">{card.from}</div>
          <div className="mt-1 text-[14px] font-semibold tracking-[-0.03em]">{card.subject}</div>
        </motion.div>
      ))}
      <div className="h-[200px]" />
    </div>
  )
}
