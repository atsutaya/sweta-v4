'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart, Bookmark, MessageCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { useSupabase } from '@/components/supabase-provider'
import { samplePosts } from '@/lib/sample-data'

type PostRecord = {
  id: string
  title: string
  content?: string | null
  category?: string | null
  created_at: string
  likes_count?: number | null
  comments_count?: number | null
  scraps_count?: number | null
  is_blinded?: boolean | null
}

type PostWithScore = PostRecord & { popularityScore: number }

const calculatePopularityScore = (post: PostRecord): number => {
  const likes = post.likes_count ?? 0
  const scraps = post.scraps_count ?? 0

  const now = Date.now()
  const postTime = Number.isFinite(new Date(post.created_at).getTime())
    ? new Date(post.created_at).getTime()
    : now
  const hoursAgo = (now - postTime) / (1000 * 60 * 60)

  const timeWeight = hoursAgo < 24 ? 1.5 : hoursAgo < 168 ? 1.2 : 1.0

  return (likes * 3 + scraps * 5) * timeWeight
}

const buildFallbackPosts = (): PostWithScore[] =>
  [...samplePosts]
    .map((post: any) => ({
      ...post,
      popularityScore: calculatePopularityScore(post),
    }))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3)

export function TrendingPosts() {
  const { supabase } = useSupabase()
  const [trendingPosts, setTrendingPosts] = useState<PostWithScore[]>([])
  const [loading, setLoading] = useState(true)

  const fallbackPosts = useMemo(() => buildFallbackPosts(), [])

  useEffect(() => {
    let isMounted = true

    const fetchTrendingPosts = async () => {
      setLoading(true)
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data, error } = await supabase
          .from('posts')
          .select('id,title,category,created_at,likes_count,comments_count,scraps_count,is_blinded')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) {
          throw error
        }

        const visiblePosts = (data ?? []).filter(post => !post.is_blinded)

        const scored = visiblePosts
          .map(post => ({
            ...post,
            popularityScore: calculatePopularityScore(post),
          }))
          .sort((a, b) => b.popularityScore - a.popularityScore)
          .slice(0, 3)

        if (isMounted) {
          setTrendingPosts(scored.length > 0 ? scored : fallbackPosts)
        }
      } catch (err) {
        console.error('Failed to load trending posts', err)
        if (isMounted) {
          setTrendingPosts(fallbackPosts)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchTrendingPosts()

    const refreshTimer = setInterval(fetchTrendingPosts, 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(refreshTimer)
    }
  }, [fallbackPosts, supabase])

  if (loading && trendingPosts.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(key => (
          <div key={key} className="h-28 rounded-lg border border-border/60 bg-muted/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (trendingPosts.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        아직 인기 게시글이 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {trendingPosts.map((post, index) => (
        <Link key={post.id} href={`/posts/${post.id}`}>
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex items-center gap-2 ${
                    index === 0
                      ? 'text-yellow-600'
                      : index === 1
                      ? 'text-gray-500'
                      : 'text-orange-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-300 to-yellow-500 text-white'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                        : 'bg-gradient-to-r from-orange-500 to-amber-700 text-white'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold">{`${index + 1}위`}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
                {post.title}
              </h3>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    {post.likes_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-yellow-500" />
                    {post.scraps_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-blue-500" />
                    {post.comments_count ?? 0}
                  </span>
                </div>
                <span className="text-xs px-2 py-1 bg-muted rounded-full">
                  {post.category ?? '기타'}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
