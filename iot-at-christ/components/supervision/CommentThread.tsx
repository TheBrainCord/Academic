'use client'

import { useState } from 'react'
import type { SupervisionComment } from '@/types/database'

interface Props {
  comments:      SupervisionComment[]
  projectId:     string
  phaseId?:      string
  sectionKey?:   string
  canSeePrivate: boolean
  onAddComment:  (content: string, isPrivate: boolean) => Promise<void>
}

export default function CommentThread({
  comments,
  canSeePrivate,
  onAddComment,
}: Props) {
  const [text, setText]           = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading]     = useState(false)

  // Build parent→children map for thread display
  const roots   = comments.filter(c => !c.parent_id)
  const replies = comments.filter(c =>  c.parent_id)

  function getReplies(parentId: string) {
    return replies.filter(c => c.parent_id === parentId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      await onAddComment(text, isPrivate)
      setText('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {roots.length === 0 && (
        <p className="text-sm text-gray-400 italic">No comments yet.</p>
      )}

      {roots.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replies={getReplies(comment.id)}
          canSeePrivate={canSeePrivate}
        />
      ))}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-gray-100">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-christ-navy resize-none"
        />
        <div className="flex items-center justify-between">
          {canSeePrivate && (
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={e => setIsPrivate(e.target.checked)}
                className="rounded"
              />
              Private (not visible to student)
            </label>
          )}
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="ml-auto px-4 py-1.5 text-sm font-medium text-white bg-christ-navy rounded-lg hover:bg-christ-navy/90 disabled:opacity-60"
          >
            {loading ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  )
}

function CommentItem({
  comment,
  replies,
  canSeePrivate,
}: {
  comment:       SupervisionComment
  replies:       SupervisionComment[]
  canSeePrivate: boolean
}) {
  if (comment.is_private && !canSeePrivate) return null

  return (
    <div className={`rounded-lg p-3 ${comment.is_private ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-700">{comment.author_id.slice(0, 8)}…</span>
        {comment.is_private && (
          <span className="text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Private</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(comment.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>

      {/* Thread replies (1 level deep) */}
      {replies.length > 0 && (
        <div className="mt-2 ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
          {replies.map(reply => (
            <div key={reply.id} className="text-sm">
              <span className="text-xs font-medium text-gray-600">{reply.author_id.slice(0, 8)}…</span>
              <p className="text-gray-700 mt-0.5">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
