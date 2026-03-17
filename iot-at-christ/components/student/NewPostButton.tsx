'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TAGS = ['question', 'discussion', 'resource', 'project', 'announcement']

export function NewPostButton() {
  const supabase   = useRouter ? createClient() : null
  const router     = useRouter()
  const [open, setOpen]     = useState(false)
  const [saving, setSaving] = useState(false)
  const [title, setTitle]   = useState('')
  const [body, setBody]     = useState('')
  const [tags, setTags]     = useState<string[]>([])
  const [error, setError]   = useState<string | null>(null)

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    setError(null)

    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setError('Not signed in'); setSaving(false); return }

    const { error: err } = await sb.from('forum_posts').insert({
      author_id: user.id,
      title:     title.trim(),
      body:      body.trim() || null,
      tags:      tags.length ? tags : null,
    })

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    setOpen(false)
    setTitle('')
    setBody('')
    setTags([])
    setSaving(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded bg-christ-navy text-white text-xs font-mono hover:bg-christ-saffron transition-colors"
      >
        + New Post
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-christ-navy/10 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-christ-navy/10">
              <h2 className="font-display font-semibold text-christ-navy text-base">New Post</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-christ-navy/40 hover:text-christ-navy text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-mono text-christ-navy/50 block mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What would you like to discuss?"
                  className="w-full rounded border border-christ-navy/20 px-3 py-2 text-sm font-body text-christ-navy focus:outline-none focus:border-christ-saffron"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-christ-navy/50 block mb-1">Body (optional)</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Add more detail…"
                  rows={4}
                  className="w-full rounded border border-christ-navy/20 px-3 py-2 text-sm font-body text-christ-navy focus:outline-none focus:border-christ-saffron resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-christ-navy/50 block mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-mono px-2 py-0.5 rounded border transition-colors ${
                        tags.includes(tag)
                          ? 'bg-christ-navy text-white border-christ-navy'
                          : 'border-christ-navy/20 text-christ-navy/60 hover:border-christ-navy/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs font-mono text-red-500">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-christ-navy/60 hover:text-christ-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="px-4 py-2 rounded bg-christ-navy text-white text-xs font-mono hover:bg-christ-saffron transition-colors disabled:opacity-50"
                >
                  {saving ? 'Posting…' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
