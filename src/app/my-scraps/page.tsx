'use client'

export const dynamic = 'force-dynamic'

import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Bookmark, Calendar, MessageCircle, ThumbsUp, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { samplePosts } from '@/lib/sample-data'
import { formatDate } from '@/lib/utils'
// supabase는 컨텍스트에서 주입된 클라이언트를 사용
import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function MyScrapsPage() {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const [scrappedPosts, setScrappedPosts] = useState<any[]>([])

  // SSR/프리렌더 안전 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])
  if (!user) return null

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rows } = await supabase
          .from('scraps')
          .select('created_at, posts(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (rows && rows.length > 0) {
          const orderedPosts = (rows as any[])
            .map((r: any) => r.posts)
            .filter((p: any) => !!p)
          setScrappedPosts(orderedPosts)
        } else {
          // 서버에 스크랩이 없을 때: 로컬 스토리지 폴백
          try {
            const scrappedIds = JSON.parse(localStorage.getItem('scrappedPostIds') || '[]') as string[]
            if (scrappedIds.length > 0) {
              const local = JSON.parse(localStorage.getItem('samplePosts') || '[]')
              setScrappedPosts((local as any[]).filter(p => scrappedIds.includes(p.id)))
            } else {
              setScrappedPosts([])
            }
          } catch {
            setScrappedPosts([])
          }
        }
      } catch {
        // 폴백: 샘플에서 상위 3개
        setScrappedPosts([])
      }
    }

    load()

    // 스크랩 변경 이벤트 수신 시 재로드
    const onScrapUpdated = () => { load() }
    if (typeof window !== 'undefined') {
      window.addEventListener('scrap-updated', onScrapUpdated as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scrap-updated', onScrapUpdated as EventListener)
      }
    }
  }, [user?.id])

  const handleRemoveScrap = async (postId: string) => {
    try {
      const { data: existing } = await supabase
        .from('scraps')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (existing?.id) {
        await supabase.from('scraps').delete().eq('id', existing.id)
      }
      setScrappedPosts(prev => prev.filter(p => p.id !== postId))
      toast({ title: '스크랩을 해제했습니다' })
    } catch {
      toast({ title: '스크랩 해제 실패', description: '잠시 후 다시 시도해주세요.' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">스크랩 한 글</h1>
              <p className="text-muted-foreground">내가 스크랩한 게시글들을 확인하세요</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>

          {scrappedPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">아직 스크랩한 글이 없습니다</h3>
                <p className="text-muted-foreground mb-4">
                  관심 있는 게시글을 스크랩해보세요!
                </p>
                <Button asChild>
                  <Link href="/">게시글 보기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {scrappedPosts.map((post) => (
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
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <Bookmark className="w-4 h-4" />
                            스크랩됨
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
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/posts/${post.id}`}>보기</Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRemoveScrap(post.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          스크랩 해제
                        </Button>
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
