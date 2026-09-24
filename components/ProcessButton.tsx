'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useMailos } from '@/components/mailos-provider'

const STEPS = ['Recruiter', 'Invoice', 'Spam', 'Follow-up', 'Interview'] as const

export function ProcessButton() {
  const { processInbox, processing, processed } = useMailos()
  const [overlay, setOverlay] = useState(false)
  const [step, setStep] = useState(0)

  const run = async () => {
    if (processing || overlay) return
    setOverlay(true)
    setStep(0)
    const pipeline = processInbox()
    for (let i = 0; i < STEPS.length; i++) {
      await wait(520)
      setStep(i + 1)
    }
    await pipeline
    await wait(420)
    setOverlay(false)
  }

  return (
    <>
      <button
        onClick={run}
        disabled={processing}
        className="group flex items-center justify-center gap-2 rounded-lg bg-[#171717] px-4 py-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-black disabled:cursor-wait disabled:opacity-80"
      >
        <Sparkles className={`size-3.5 text-[#d9f99d] ${processing ? 'animate-spin' : 'group-hover:rotate-12'}`} />
        {processing ? 'Processing inbox...' : processed ? 'Re-process inbox' : 'Process inbox'}
        <ArrowUpRight className="size-3.5 text-white/45" />
      </button>

      <AnimatePresence>
        {overlay && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-[#111]/88 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-[min(440px,calc(100vw-32px))]">
              <p className="mb-6 text-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#d9f99d]">
                Routing inbox
              </p>
              <div className="relative h-[220px]">
                {STEPS.map((label, index) => (
                  <motion.div
                    layout
                    key={label}
                    className="absolute left-0 right-0 rounded-xl border border-white/10 bg-[#1c1c1c] px-5 py-4 text-white shadow-2xl"
                    initial={{ y: 80 + index * 16, opacity: 0, scale: 0.96 }}
                    animate={
                      step > index
                        ? { y: -28, opacity: 0, scale: 0.9, x: index % 2 === 0 ? -40 : 40 }
                        : { y: index * 18, opacity: 1, scale: 1, x: 0 }
                    }
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                  >
                    <div className="flex items-center justify-between text-[14px] font-medium">
                      {label}
                      <span className="text-[#d9f99d]">{step > index ? '✓' : '…'}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-8 space-y-2">
                {STEPS.map((label, index) => (
                  <div key={label} className="flex items-center justify-between text-[13px] text-white/70">
                    <span>{label}</span>
                    <motion.span
                      className="font-semibold text-[#d9f99d]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: step > index ? 1 : 0.25 }}
                    >
                      {step > index ? '✓' : ''}
                    </motion.span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
