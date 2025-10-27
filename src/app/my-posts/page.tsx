'use client'

import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, Calendar, MessageCircle, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { samplePosts } from '@/lib/sample-data'
import { formatDate } from '@/lib/utils'
import { useState, useEffect } from 'react'

export default function MyPostsPage() {
  const { user } = useSupabase()
  const router = useRouter()

  // samplePosts와 로컬 스토리지의 게시글을 합쳐서 내가 쓴 글 필터링
  const [myPosts, setMyPosts] = useState(samplePosts.filter(post => post.user_id === 'sample-user-1'))
  
  useEffect(() => {
    // 로컬 스토리지에서 추가 게시글 로드
    const localPosts = JSON.parse(localStorage.getItem('samplePosts') || '[]')
    const allPosts = [...localPosts, ...samplePosts]
    setMyPosts(allPosts.filter(post => post.user_id === 'sample-user-1'))
  }, [])

  // 사용자가 없어도 페이지는 표시 (데모용)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">내가 쓴 글</h1>
              <p className="text-muted-foreground">내가 작성한 게시글들을 확인하세요</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>

          {myPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">아직 작성한 글이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  첫 번째 게시글을 작성해보세요!
                </p>
                <Button asChild>
                  <Link href="/posts/create">글쓰기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                            {post.category}
                          </span>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2">
                          <Link href={`/posts/${post.id}`} className="hover:text-primary transition-colors">
                            {post.title}
                          </Link>
                        </h3>
                        
                        <p className="text-muted-foreground line-clamp-2 mb-3">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {post.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                         {/* 보기 버튼 제거 - 제목 클릭으로 이동 */}
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
