import { createClient } from '@/lib/supabase/server'

export default async function TeacherForumPage() {
  const supabase = createClient()

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name), forum_replies(count)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-christ-navy">Forum</h1>
      <div className="space-y-3">
        {posts?.map(post => (
          <div key={post.id} className="rounded-lg border border-christ-navy/10 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {post.is_pinned && (
                  <span className="text-xs font-mono text-christ-saffron mr-2">📌 PINNED</span>
                )}
                {post.is_announcement && (
                  <span className="text-xs font-mono text-christ-green mr-2">📢 ANNOUNCEMENT</span>
                )}
                <h2 className="font-display font-semibold text-christ-navy">{post.title}</h2>
                <p className="text-xs font-mono text-christ-navy/40 mt-1">
                  {(post.profiles as any)?.full_name} · {new Date(post.created_at).toLocaleDateString('en-IN')}
                </p>
              </div>
              <span className="text-xs font-mono text-christ-navy/40 whitespace-nowrap">
                {(post.forum_replies as any)?.[0]?.count ?? 0} replies
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
