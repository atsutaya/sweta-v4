'use client'

import { memo, useState, useCallback } from 'react'
import Link from 'next/link'
import { formatDate, truncateText } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, MessageCircle, Bookmark } from 'lucide-react'

type Post = {
  id: string
  title: string
  content: string
  category: string
  user_id: string
  created_at: string
  updated_at: string
  likes_count: number
  dislikes_count: number
  comments_count: number
  is_blinded: boolean
  is_pinned: boolean
  is_notice: boolean
}

interface PostCardProps {
  post: Post
}

export const PostCard = memo(function PostCard({ post }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      '자유': 'bg-blue-100 text-blue-700 border-blue-200',
      '질문': 'bg-green-100 text-green-700 border-green-200',
      '정보': 'bg-purple-100 text-purple-700 border-purple-200',
      '고민': 'bg-orange-100 text-orange-700 border-orange-200',
      '공지': 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  return (
    <Link href={`/posts/${post.id}`}>
      <Card 
        className={`transition-all duration-200 cursor-pointer border-2 ${
          isHovered ? 'shadow-lg border-primary/20' : 'hover:shadow-md hover:border-primary/10'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardContent className="p-4 sm:p-5">
          {/* 헤더 섹션 */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">익명</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground" suppressHydrationWarning>
                  {formatDate(post.created_at)}
                </span>
              </div>
            </div>
            
            {/* 카테고리 태그 */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(post.category)}`}>
              {post.category}
            </div>
          </div>

          {/* 게시글 제목만 */}
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 leading-tight">
              {post.title}
            </h3>
          </div>

          {/* 반응 아이콘들 - 읽기 전용 */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                <span className="text-sm font-medium">{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                <span className="text-sm font-medium">{(post as any).scraps_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <span className="text-sm font-medium">{post.comments_count}</span>
              </div>
            </div>
            
            {/* 추가 정보 */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>익명 게시글</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})
