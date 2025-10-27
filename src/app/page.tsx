import { PostList } from '@/components/post-list'
import { TrendingPosts } from '@/components/trending-posts'
import { CreatePostButton } from '@/components/create-post-button'
import { FloatingCreateButton } from '@/components/floating-create-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Users, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 섹션 */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                사우고 에타
              </h1>
              <div className="hidden sm:block">
                <CreatePostButton />
              </div>
            </div>
          </div>

          {/* 인기 게시글 섹션 */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                인기 게시글
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                좋아요, 댓글, 스크랩을 종합한 인기 게시글입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <TrendingPosts />
            </CardContent>
          </Card>

          {/* 전체 게시글 섹션 */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              전체 게시글
            </h2>
            <PostList />
          </div>
        </div>
      </div>
      
      {/* 모바일 플로팅 새 게시글 작성 버튼 */}
      <FloatingCreateButton />
    </div>
  )
}
