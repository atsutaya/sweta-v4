'use client'

export const dynamic = 'force-dynamic'

import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, MessageSquare, Calendar, User, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sampleComments, samplePosts } from '@/lib/sample-data'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

export default function MyCommentsPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [commentsWithPosts, setCommentsWithPosts] = useState<{ comment: any, post: any }[]>([])
  const [loading, setLoading] = useState(true)

  // SSR/프리렌더 안전 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])
  if (!user) return null

  useEffect(() => {
    (async () => {
      try {
        if (!user) return
        // Supabase에서 내 댓글 로드
        const { data: myCommentsData, error } = await supabase
          .from('comments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        const myComments = myCommentsData || []

        // 해당 게시글들 로드
        const postIds = Array.from(new Set(myComments.map((c: any) => c.post_id)))
        let postsMap: Record<string, any> = {}
        if (postIds.length > 0) {
          const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds)
          postsMap = Object.fromEntries((postsData || []).map((p: any) => [p.id, p]))
        }

        setCommentsWithPosts(
          myComments
            .map((comment: any) => ({ comment, post: postsMap[comment.post_id] }))
            .filter((x: any) => x.post)
        )
      } catch {
        // 폴백: 샘플 데이터
        const myComments = sampleComments.filter(comment => comment.user_id === 'sample-user-2')
        const joined = myComments.map(comment => ({ comment, post: samplePosts.find(p => p.id === comment.post_id) })).filter(x => x.post)
        setCommentsWithPosts(joined as any)
      } finally {
        setLoading(false)
      }
    })()
  }, [user?.id])

  // 새 댓글 생성 시 즉시 새로고침
  useEffect(() => {
    const refetch = async () => {
      try {
        if (!user) return
        const { data: myCommentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        const myComments = myCommentsData || []
        const postIds = Array.from(new Set(myComments.map((c: any) => c.post_id)))
        let postsMap: Record<string, any> = {}
        if (postIds.length > 0) {
          const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .in('id', postIds)
          postsMap = Object.fromEntries((postsData || []).map((p: any) => [p.id, p]))
        }
        setCommentsWithPosts(
          myComments
            .map((comment: any) => ({ comment, post: postsMap[comment.post_id] }))
            .filter((x: any) => x.post)
        )
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('comment-created', refetch as any)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('comment-created', refetch as any)
      }
    }
  }, [user?.id])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">댓글 단 글</h1>
              <p className="text-muted-foreground">내가 댓글을 단 게시글들을 확인하세요</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">불러오는 중...</CardContent>
            </Card>
          ) : commentsWithPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">아직 댓글을 단 글이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  게시글에 댓글을 달아보세요!
                </p>
                <Button asChild>
                  <Link href="/">게시글 보기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {commentsWithPosts.map(({ comment, post }) => (
                <Card key={comment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 게시글 정보 */}
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-muted-foreground bg-background px-2 py-1 rounded">
                              {post?.category}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {post && formatDate(post.created_at)}
                            </div>
                          </div>
                          
                          <h4 className="font-medium mb-1">
                            <Link href={`/posts/${post?.id}`} className="hover:text-primary transition-colors">
                              {post?.title}
                            </Link>
                          </h4>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post?.content}
                          </p>
                        </div>
                        
                        {/* 내 댓글 */}
                        <div className="border-l-4 border-primary pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {((comment as any)?.is_anonymous !== false)
                                ? `익명${comment.anonymous_number ?? ''}`
                                : (comment as any)?.user_display_name || '사용자'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          
                          <p className="text-foreground mb-2">{comment.content}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" />
                              {comment.likes_count}
                            </div>
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
