'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from './supabase-provider'
import { PostCard } from './post-card'
import { Button } from './ui/button'
import { MessageSquare, FileText, Bookmark } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { samplePosts, sampleComments } from '@/lib/sample-data'
import { supabase } from '@/lib/supabase'

export function MyActivity() {
  const [activeTab, setActiveTab] = useState<'posts' | 'scraps' | 'comments'>('posts')
  const [posts, setPosts] = useState(samplePosts.filter(post => post.user_id === 'sample-user-1'))
  const [scraps, setScraps] = useState<any[]>([])
  const [comments, setComments] = useState(sampleComments.filter(comment => comment.user_id === 'sample-user-1'))
  const { user } = useSupabase()

  useEffect(() => {
    // 로컬 스토리지에서 추가 게시글/댓글/스크랩 로드 (기본값)
    const localPosts = JSON.parse(localStorage.getItem('samplePosts') || '[]')
    const localComments = JSON.parse(localStorage.getItem('sampleComments') || '[]')
    const allPosts = [...localPosts, ...samplePosts]
    const allComments = [...localComments, ...sampleComments]

    // 기본 데모 데이터 세팅
    setPosts(allPosts.filter(post => post.user_id === 'sample-user-1'))
    setComments(allComments.filter(comment => comment.user_id === 'sample-user-1'))

    // 스크랩된 글: ID 목록을 기준으로 수집 (없으면 데모로 상위 3개)
    const scrappedIds = JSON.parse(localStorage.getItem('scrappedPostIds') || '[]') as string[]
    if (scrappedIds.length > 0) {
      setScraps(allPosts.filter(p => scrappedIds.includes(p.id)))
    } else {
      setScraps(samplePosts.slice(0, 3))
    }

    // 로그인된 경우 Supabase에서 실제 데이터 로드 (실패 시 위 데모 데이터 유지)
    ;(async () => {
      try {
        if (!user) return

        // 내 글
        const { data: myPostsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!postsError && myPostsData) {
          setPosts(myPostsData as any[])
        }

        // 내 댓글
        const { data: myCommentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!commentsError && myCommentsData) {
          setComments(myCommentsData as any[])
        }

        // 내 스크랩: scrap 시점 기준으로 최신순 정렬
        const { data: scrapRows, error: scrapsError } = await supabase
          .from('scraps')
          .select('created_at, posts(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!scrapsError && scrapRows && scrapRows.length > 0) {
          const scrappedPosts = (scrapRows as any[]).map((r: any) => r.posts).filter((p: any) => !!p)
          setScraps(scrappedPosts as any[])
        } else {
          // 폴백: 로컬 스토리지의 스크랩 ID 사용
          const scrappedIds = JSON.parse(localStorage.getItem('scrappedPostIds') || '[]') as string[]
          if (scrappedIds.length > 0) {
            const allPosts = [...JSON.parse(localStorage.getItem('samplePosts') || '[]'), ...samplePosts]
            setScraps(allPosts.filter(p => scrappedIds.includes(p.id)))
          }
        }
      } catch (e) {
        // 무시하고 데모 데이터 유지
      }
    })()
  }, [])

  // 탭 전환 시 최신 데이터 재조회 (특히 내 댓글, 스크랩)
  useEffect(() => {
    ;(async () => {
      try {
        if (!user) return
        if (activeTab === 'comments') {
          const { data } = await supabase
            .from('comments')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (data) setComments(data as any[])
        }
        if (activeTab === 'scraps') {
          const { data: scrapRows } = await supabase
            .from('scraps')
            .select('created_at, posts(*)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
          if (scrapRows && scrapRows.length > 0) {
            const scrappedPosts = (scrapRows as any[]).map((r: any) => r.posts).filter((p: any) => !!p)
            setScraps(scrappedPosts)
          }
        }
      } catch {}
    })()
  }, [activeTab, user?.id])

  // 새 댓글 생성 시 내 댓글 탭 데이터 즉시 새로고침
  useEffect(() => {
    const handler = async () => {
      try {
        if (!user) return
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (data) setComments(data as any[])
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('comment-created', handler as any)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('comment-created', handler as any)
      }
    }
  }, [user?.id])

  // 사용자 인증 체크 제거 (데모용)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
        <Button
          variant={activeTab === 'posts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('posts')}
          className="w-full justify-center flex items-center gap-2 text-sm py-2"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden sm:inline">내 글 ({posts?.length || 0})</span>
        </Button>
        <Button
          variant={activeTab === 'scraps' ? 'default' : 'outline'}
          onClick={() => setActiveTab('scraps')}
          className="w-full justify-center flex items-center gap-2 text-sm py-2"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">스크랩한 글 ({scraps?.length || 0})</span>
        </Button>
        <Button
          variant={activeTab === 'comments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('comments')}
          className="w-full justify-center flex items-center gap-2 text-sm py-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">내 댓글 ({comments?.length || 0})</span>
        </Button>
      </div>

      {activeTab === 'posts' ? (
        <div>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              작성한 글이 없습니다.
            </div>
          )}
        </div>
      ) : activeTab === 'scraps' ? (
        <div>
          {scraps && scraps.length > 0 ? (
            <div className="space-y-4">
              {scraps.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              스크랩한 글이 없습니다.
            </div>
          )}
        </div>
      ) : (
        <div>
          {comments && comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                // 댓글이 속한 게시글 로드 (서버 우선, 폴백: 로컬)
                const post = undefined as any
                return (
                  <div key={comment.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">익명{comment.anonymous_number}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <a href={`/posts/${comment.post_id}`} className="text-sm text-primary hover:underline">
                        원글 바로가기
                      </a>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              작성한 댓글이 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
