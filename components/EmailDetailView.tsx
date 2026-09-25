'use client'

import { Bell, Check, Reply, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useMailos } from '@/components/mailos-provider'
import { categoryTone, priorityLabel } from '@/lib/priority'
import { formatReceived, initials } from '@/lib/utils'
import type { EmailAnalysis } from '@/types'

// Wrap the email HTML in a document that fits the app, then load it in a
// sandboxed iframe (no scripts, no same-origin) so it can't touch the app.
function htmlDocument(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><base target="_blank" /><style>
    html { color-scheme: light; }
    body { margin: 0; padding: 0; font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #171717; word-break: break-word; overflow-wrap: anywhere; }
    img { max-width: 100%; height: auto; }
    table { max-width: 100%; }
    a { color: #2563eb; }
    blockquote { margin: 0 0 0 12px; padding-left: 12px; border-left: 2px solid #e5e5e5; color: #525252; }
  </style></head><body>${html}</body></html>`
}

export function EmailDetailView({ id }: { id: string }) {
  const { emails, completed, categories, toggleDone } = useMailos()
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  const email = emails.find((item) => item.id === id)

  if (!email) {
    return <p className="text-sm text-black/45">This email is not in the current processed inbox.</p>
  }

  const jev = analysis?.jev ?? email.jev
  const groq = analysis?.groq ?? email.groq
  const tone = categoryTone(jev.category)
  const priority = priorityLabel(jev.priority)
  const done = completed.includes(email.id)

  const analyze = async () => {
    if (analyzing) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          body: email.body,
          sender: `${email.sender} <${email.senderEmail}>`,
          categories,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAnalyzeError(typeof data.error === 'string' ? data.error : 'Analysis failed.')
        return
      }
      setAnalysis(data as EmailAnalysis)
    } catch {
      setAnalyzeError('Could not reach the server.')
    } finally {
      setAnalyzing(false)
    }
  }

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

        {email.bodyHtml ? (
          <iframe
            title={`${email.subject} — email content`}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={htmlDocument(email.bodyHtml)}
            className="mt-6 h-[58vh] min-h-[340px] w-full rounded-xl border border-black/8 bg-white"
          />
        ) : (
          <pre className="mt-6 whitespace-pre-wrap font-sans text-[14px] leading-6 text-black/70">
            {email.body}
          </pre>
        )}
      </article>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-black/8 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/35">
              AI insights
            </p>
            <button
              onClick={analyze}
              disabled={analyzing}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-black/60 transition hover:text-black disabled:cursor-wait disabled:opacity-60"
            >
              <Sparkles className={`size-3 ${analyzing ? 'animate-pulse' : ''}`} />
              {analyzing ? 'Analysing…' : analysis ? 'Re-analyse' : 'Analyse this email'}
            </button>
          </div>

          {analyzeError && (
            <p className="mt-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-[12px] text-[#991b1b]">
              {analyzeError}
            </p>
          )}

          {analysis && (
            <div className="mt-4 rounded-xl bg-[#f7fee7] p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3f6212]">
                Summary
              </p>
              <p className="mt-2 text-[13px] leading-5 text-black/75">{analysis.summary}</p>
              {analysis.highlights.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {analysis.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-2 text-[12px] leading-5 text-black/60">
                      <span className="text-[#65a30d]">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between">
              <dt className="text-black/40">Category</dt>
              <dd className="font-semibold">{jev.category}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Priority</dt>
              <dd className="font-semibold">
                {priority.emoji} {jev.priority}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Needs reply</dt>
              <dd className="font-semibold">{jev.needs_reply ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Calendar</dt>
              <dd className="font-semibold">{jev.calendar ? 'Yes' : 'No'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-black/40">Confidence</dt>
              <dd className="font-semibold">{Math.round(jev.confidence * 100)}%</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-[#171717] p-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d9f99d]">
            Suggested actions
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {(groq.actions.length ? groq.actions : ['Reply', 'Add Reminder', 'Mark Done']).map((action) => (
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
          {(groq.date || groq.time || groq.amount) && (
            <p className="mt-4 text-[12px] text-white/45">
              {[groq.company, groq.date, groq.time, groq.amount].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
