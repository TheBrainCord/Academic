import { createClient } from '@/lib/supabase/server'

export default async function StudentForumPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name, avatar_url), forum_replies(count)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-christ-navy">Forum</h1>
        {/* TODO: NewPostButton client component */}
      </div>

      <div className="space-y-3">
        {posts?.map(post => (
          <div key={post.id} className="rounded-lg border border-christ-navy/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {post.is_pinned && <span className="text-xs font-mono text-christ-saffron">📌</span>}
                  {post.is_announcement && <span className="text-xs font-mono text-christ-green">📢</span>}
                  {(post.tags as string[])?.map((tag, i) => (
                    <span key={i} className="text-xs font-mono text-christ-navy/40 border border-christ-navy/10 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="font-display font-semibold text-christ-navy text-sm">{post.title}</h2>
                <p className="text-xs font-mono text-christ-navy/40 mt-1">
                  {(post.profiles as any)?.full_name} · {new Date(post.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="text-xs font-mono text-christ-navy/40 text-right whitespace-nowrap">
                <div>{(post.forum_replies as any)?.[0]?.count ?? 0} replies</div>
                <div>♡ {post.likes}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
