'use client'

import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMailos } from '@/components/mailos-provider'
import { DEFAULT_CATEGORIES, MAX_CATEGORIES, normalizeName, type CategoryDef } from '@/lib/categories'

export function CategoriesSettings() {
  const { categories, saveCategories, processInbox, processing, emails } = useMailos()
  const [draft, setDraft] = useState<CategoryDef[]>(categories)
  const [dirty, setDirty] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  // Adopt categories once they load from storage, unless the user is editing.
  useEffect(() => {
    if (!dirty) setDraft(categories)
  }, [categories, dirty])

  const update = (index: number, patch: Partial<CategoryDef>) => {
    setDraft((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
    setDirty(true)
    setMessage(null)
  }

  const remove = (index: number) => {
    setDraft((items) => items.filter((_, i) => i !== index))
    setDirty(true)
    setMessage(null)
  }

  const add = () => {
    const nextName = normalizeName(name)
    if (!nextName) {
      setMessage('Give the category a name.')
      return
    }
    if (draft.some((item) => item.name === nextName)) {
      setMessage(`${nextName} already exists.`)
      return
    }
    if (draft.length >= MAX_CATEGORIES) {
      setMessage(`You can have up to ${MAX_CATEGORIES} categories.`)
      return
    }
    setDraft((items) => [
      ...items,
      { name: nextName, description: description.trim() || nextName.toLowerCase().replace(/_/g, ' ') },
    ])
    setName('')
    setDescription('')
    setDirty(true)
    setMessage(null)
  }

  const reset = () => {
    setDraft(DEFAULT_CATEGORIES)
    setDirty(true)
    setMessage(null)
  }

  const save = () => {
    saveCategories(draft)
    setDirty(false)
    setMessage('Saved. Re-process your inbox to apply.')
  }

  const saveAndProcess = async () => {
    saveCategories(draft)
    setDirty(false)
    await processInbox(draft)
    setMessage('Saved and re-processed.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-black/8 bg-white p-5 sm:p-6">
        <p className="text-[13px] leading-6 text-black/55">
          Jev routes each email into one of these buckets. Each category is one option with its own
          description, so write the description as the rule Jev should apply — the sharper it is, the
          better the routing.
        </p>

        <div className="mt-5 space-y-2">
          {draft.map((category, index) => (
            <div
              key={`${category.name}-${index}`}
              className="flex flex-col gap-2 rounded-xl border border-black/8 p-3 sm:flex-row sm:items-center"
            >
              <input
                value={category.name}
                onChange={(event) =>
                  update(index, {
                    name: event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_]+/g, '_')
                      .slice(0, 32),
                  })
                }
                aria-label="Category name"
                className="w-full shrink-0 rounded-lg border border-black/10 bg-[#f4f4f0] px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-black/55 outline-none focus:border-black/30 sm:w-[150px] sm:text-center"
              />
              <input
                value={category.description}
                onChange={(event) => update(index, { description: event.target.value })}
                placeholder="Describe what belongs in this category"
                className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-[13px] outline-none focus:border-black/30"
              />
              <button
                onClick={() => remove(index)}
                title={`Remove ${category.name || 'category'}`}
                className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/10 text-black/40 hover:text-[#b91c1c]"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-black/15 p-3 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && add()}
            placeholder="New category name"
            className="w-full shrink-0 rounded-lg border border-black/10 px-3 py-2 text-[13px] outline-none focus:border-black/30 sm:w-[180px]"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && add()}
            placeholder="What belongs in it?"
            className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-[13px] outline-none focus:border-black/30"
          />
          <button
            onClick={add}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#171717] px-3 py-2 text-[12px] font-semibold text-white"
          >
            <Plus className="size-3.5 text-[#d9f99d]" /> Add
          </button>
        </div>

        {message && <p className="mt-3 text-[12px] text-black/50">{message}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={save}
            disabled={!dirty}
            className="rounded-lg bg-[#171717] px-4 py-2.5 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            Save categories
          </button>
          <button
            onClick={saveAndProcess}
            disabled={processing || !emails.length}
            className="rounded-lg border border-black/10 bg-white px-4 py-2.5 text-[12px] font-semibold text-black/70 disabled:opacity-40"
          >
            {processing ? 'Processing…' : 'Save & re-process inbox'}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-[12px] font-medium text-black/45 hover:text-black"
          >
            <RotateCcw className="size-3.5" /> Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}
