'use client'

import { samplePosts } from '@/lib/sample-data'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Heart, Bookmark, MessageCircle } from 'lucide-react'

export function TrendingPosts() {
  // 인기 게시글 (Reddit 스타일 인기도 계산)
  const trendingPosts = [...samplePosts]
    .map(post => {
      const likes = post.likes_count || 0
      const comments = post.comments_count || 0
      const scraps = (post as any).scraps_count || 0
      
      // 시간 가중치 계산 (24시간 이내 게시글에 가중치)
      const now = Date.now()
      const postTime = new Date(post.created_at).getTime()
      const hoursAgo = (now - postTime) / (1000 * 60 * 60)
      const timeWeight = hoursAgo < 24 ? 1.5 : hoursAgo < 168 ? 1.2 : 1.0 // 24시간: 1.5배, 1주일: 1.2배
      
      // 인기도 점수 = (좋아요 + 댓글*2 + 스크랩*3) * 시간가중치
      const popularityScore = (likes + comments * 2 + scraps * 3) * timeWeight
      
      return { ...post, popularityScore }
    })
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {trendingPosts.map((post, index) => (
        <Link key={post.id} href={`/posts/${post.id}`}>
          <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
            <CardContent className="p-4">
              {/* 순위 배지 */}
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 ${
                  index === 0 ? 'text-yellow-600' : 
                  index === 1 ? 'text-gray-500' : 
                  'text-amber-600'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                    'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold">
                    {`${index + 1}위`}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              {/* 게시글 제목 */}
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
                {post.title}
              </h3>

              {/* 통계 정보 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    {post.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="w-3 h-3 text-yellow-500" />
                    {(post as any).scraps_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-blue-500" />
                    {post.comments_count}
                  </span>
                </div>
                <span className="text-xs px-2 py-1 bg-muted rounded-full">
                  {post.category}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
