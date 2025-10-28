'use client'

import { useState, useEffect } from 'react'
import { samplePosts, sampleComments } from '@/lib/sample-data'
// supabase는 컨텍스트에서 가져와 인증 세션 일관성을 유지
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { useSupabase } from '@/components/supabase-provider'
import { Heart, ArrowLeft, Bookmark as BookmarkIcon, ThumbsDown, ThumbsUp, MoreVertical, Flag } from 'lucide-react'
import Link from 'next/link'
import { CreateCommentForm } from '@/components/create-comment-form'
import { ReportModal } from '@/components/report-modal'

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [pendingReactions, setPendingReactions] = useState<Record<string, boolean>>({})
  const [userReactionByCommentId, setUserReactionByCommentId] = useState<Record<string, 'like' | 'dislike' | null>>({})
  const [userIdToProfile, setUserIdToProfile] = useState<Record<string, { nickname?: string; email?: string }>>({})
  const { user, supabase } = useSupabase()
  
  // 로컬 상태로 공감/스크랩 상태 관리 (hooks는 항상 최상위에서 호출)
  const [isLiked, setIsLiked] = useState(false)
  const [isScrapped, setIsScrapped] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [scrapCount, setScrapCount] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportCommentId, setReportCommentId] = useState<string | null>(null)
  const [postMenuOpen, setPostMenuOpen] = useState(false)
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null)
  const isUuid = (value: string) => /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(value)
  
  useEffect(() => {
    // 우선 로컬/샘플 데이터로 즉시 표시
    const localPosts = JSON.parse(localStorage.getItem('samplePosts') || '[]')
    const allPosts = [...localPosts, ...samplePosts]
    const fallbackPost = allPosts.find(p => p.id === params.id)
    if (fallbackPost) {
      setPost(fallbackPost)
      setLikeCount(fallbackPost.likes_count || 0)
    }

    // Supabase에서 실제 데이터 로드 (가능하면 교체)
    ;(async () => {
      try {
        if (!isUuid(params.id)) {
          // 로컬 생성 글(비 UUID)은 서버 조회 스킵
          return
        }
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', params.id)
          .maybeSingle()

        if (!postError && postData) {
          // 로컬 override가 있으면 카운트 보정
          try {
            const overrides = JSON.parse(localStorage.getItem('scrapCountOverrides') || '{}')
            const overrideCount = overrides?.[postData.id]
            setPost({ ...postData, scraps_count: typeof overrideCount === 'number' ? overrideCount : postData.scraps_count })
            setLikeCount(postData.likes_count || 0)
            setScrapCount(typeof overrideCount === 'number' ? overrideCount : (postData.scraps_count || 0))
          } catch {
            setPost(postData)
            setLikeCount(postData.likes_count || 0)
            setScrapCount(postData.scraps_count || 0)
          }
          // 신뢰성 강화를 위해 서버에서 실제 like 수 재계산 (트리거 미동작 대비)
          try {
            const { count } = await supabase
              .from('post_reactions')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', postData.id)
              .eq('reaction_type', 'like')
            if (typeof count === 'number') {
              setLikeCount(count)
              setPost((p: any) => ({ ...p, likes_count: count }))
            }
          } catch {}
        }

        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', params.id)
          .order('created_at', { ascending: true })

        if (commentsData) {
          // 방어적 정규화
          const normalized = commentsData.map((c: any) => ({
            ...c,
            likes_count: typeof c.likes_count === 'number' ? c.likes_count : 0,
            dislikes_count: typeof c.dislikes_count === 'number' ? c.dislikes_count : 0,
            created_at: c.created_at || new Date().toISOString(),
            anonymous_number: typeof c.anonymous_number === 'number' ? c.anonymous_number : 0,
          }))
          setComments(normalized)
          // 현재 사용자 반응 로드
          if (user && normalized.length > 0) {
            const commentIds = normalized.map((c: any) => c.id)
            const { data: myReactions } = await supabase
              .from('comment_reactions')
              .select('comment_id,reaction_type')
              .in('comment_id', commentIds)
              .eq('user_id', user.id)
            if (myReactions) {
              const map: Record<string, 'like' | 'dislike' | null> = {}
              for (const r of myReactions as any[]) map[r.comment_id] = r.reaction_type
              setUserReactionByCommentId(map)
            } else {
              setUserReactionByCommentId({})
            }
          }
          // 댓글 작성자 프로필 로드 (익명 해제 시 표시용)
          const userIds = Array.from(new Set(normalized.map((c: any) => c.user_id).filter(Boolean)))
          if (userIds.length > 0) {
            let profiles: any[] | null = null
            if (userIds.length === 1) {
              const { data } = await supabase
                .from('profiles')
                .select('id, email, nickname')
                .eq('id', userIds[0])
                .maybeSingle()
              profiles = data ? [data] : []
            } else {
              const { data } = await supabase
                .from('profiles')
                .select('id, email, nickname')
                .in('id', userIds)
              profiles = data || []
            }
            if (profiles && profiles.length > 0) {
              const map: Record<string, { nickname?: string; email?: string }> = {}
              for (const p of profiles as any[]) {
                map[p.id] = { nickname: p.nickname, email: p.email }
              }
              setUserIdToProfile(map)
            }
          }
        } else {
          // 폴백: 샘플 댓글
          const fallback = sampleComments
            .filter(c => c.post_id === params.id)
            .map(c => ({
              ...c,
              likes_count: typeof (c as any).likes_count === 'number' ? (c as any).likes_count : 0,
              dislikes_count: typeof (c as any).dislikes_count === 'number' ? (c as any).dislikes_count : 0,
              created_at: (c as any).created_at || new Date().toISOString(),
              anonymous_number: typeof (c as any).anonymous_number === 'number' ? (c as any).anonymous_number : 0,
            }))
          setComments(fallback as any)
        }
      } catch (e) {
        // 폴백: 샘플 댓글
        const fallback = sampleComments
          .filter(c => c.post_id === params.id)
          .map(c => ({
            ...c,
            likes_count: typeof (c as any).likes_count === 'number' ? (c as any).likes_count : 0,
            dislikes_count: typeof (c as any).dislikes_count === 'number' ? (c as any).dislikes_count : 0,
            created_at: (c as any).created_at || new Date().toISOString(),
            anonymous_number: typeof (c as any).anonymous_number === 'number' ? (c as any).anonymous_number : 0,
          }))
        setComments(fallback as any)
      } finally {
        setLoading(false)
      }
    })()
  }, [params.id])

  // 사용자의 기존 좋아요/스크랩 여부 로드 (서버 OR 로컬 폴백 병행)
  useEffect(() => {
    ;(async () => {
      try {
        if (!post?.id) return
        const localIds = new Set<string>(JSON.parse(localStorage.getItem('scrappedPostIds') || '[]'))
        const localHas = localIds.has(post.id)

        if (!user || !isUuid(post.id)) {
          // 로그인하지 않은 사용자는 항상 좋아요/스크랩 상태를 false로 설정
          setIsLiked(false)
          setIsScrapped(false)
          return
        }

        const { data: likeRow } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like')
          .maybeSingle()
        setIsLiked(!!likeRow)

        const { data: scrapRow } = await supabase
          .from('scraps')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle()
        setIsScrapped(!!scrapRow || localHas)
      } catch {}
    })()
  }, [user, post?.id])
  
  // Realtime: 게시글 카운트/댓글 변경 구독 (UUID 게시글에서만 구독)
  useEffect(() => {
    if (!post?.id || !isUuid(post.id)) return
    const channel = supabase.channel(`post-${post.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${post.id}` }, (payload) => {
        const row: any = payload.new
        if (typeof row.likes_count === 'number') setLikeCount(row.likes_count)
        if (typeof row.scraps_count === 'number') setScrapCount(row.scraps_count)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, async () => {
        // 새 댓글이 추가되면 목록 재조회(간단히 Supabase fetch 한번 더)
        const { data } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true })
        if (data) {
          setComments(data as any)
          // 실시간 추가 시 내 반응 갱신
          if (user && (data as any[]).length > 0) {
            const ids = (data as any[]).map((c: any) => c.id)
            const { data: myReactions } = await supabase
              .from('comment_reactions')
              .select('comment_id,reaction_type')
              .in('comment_id', ids)
              .eq('user_id', user.id)
            if (myReactions) {
              const map: Record<string, 'like' | 'dislike' | null> = {}
              for (const r of myReactions as any[]) map[r.comment_id] = r.reaction_type
              setUserReactionByCommentId(map)
            }
          }
          const userIds = Array.from(new Set((data as any[]).map(c => c.user_id).filter(Boolean)))
          if (userIds.length > 0) {
            let profiles: any[] | null = null
            if (userIds.length === 1) {
              const { data: one } = await supabase
                .from('profiles')
                .select('id, email, nickname')
                .eq('id', userIds[0])
                .maybeSingle()
              profiles = one ? [one] : []
            } else {
              const { data: many } = await supabase
                .from('profiles')
                .select('id, email, nickname')
                .in('id', userIds)
              profiles = many || []
            }
            if (profiles && profiles.length > 0) {
              const map: Record<string, { nickname?: string; email?: string }> = {}
              for (const p of profiles as any[]) {
                map[p.id] = { nickname: p.nickname, email: p.email }
              }
              setUserIdToProfile(map)
            }
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [post?.id])

  // 댓글이 바뀔 때 프로필 정보가 비어있는 사용자만 추가 로드
  useEffect(() => {
    ;(async () => {
      try {
        const missing = Array.from(new Set(
          (comments || [])
            .map((c: any) => c.user_id)
            .filter((uid: string) => uid && !userIdToProfile[uid])
        ))
        if (missing.length === 0) return
        let profiles: any[] | null = null
        if (missing.length === 1) {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, nickname')
            .eq('id', missing[0])
            .maybeSingle()
          profiles = data ? [data] : []
        } else {
          const { data } = await supabase
            .from('profiles')
            .select('id, email, nickname')
            .in('id', missing)
          profiles = data || []
        }
        if (profiles && profiles.length > 0) {
          setUserIdToProfile(prev => {
            const next = { ...prev }
            for (const p of profiles as any[]) {
              next[p.id] = { nickname: p.nickname, email: p.email }
            }
            return next
          })
        }
      } catch {}
    })()
  }, [comments])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }
  
  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600">게시글을 찾을 수 없습니다.</div>
      </div>
    )
  }

  // 댓글 정렬: Reddit 스타일 인기 댓글 시스템
  const sortedComments = [...comments].sort((a, b) => {
    const aLikes = a?.likes_count ?? 0
    const bLikes = b?.likes_count ?? 0
    const aDislikes = a?.dislikes_count ?? 0
    const bDislikes = b?.dislikes_count ?? 0
    
    // 1. 순공감 점수 계산 (좋아요 - 싫어요)
    const aScore = aLikes - aDislikes
    const bScore = bLikes - bDislikes
    
    // 2. 시간 가중치 적용 (최신 댓글에 약간의 가중치)
    const now = Date.now()
    const aTime = Number.isFinite(new Date(a?.created_at ?? 0).getTime()) ? new Date(a?.created_at ?? 0).getTime() : 0
    const bTime = Number.isFinite(new Date(b?.created_at ?? 0).getTime()) ? new Date(b?.created_at ?? 0).getTime() : 0
    
    // 3. 시간 가중치 (24시간 이내 댓글에 1.2배 가중치)
    const aTimeWeight = (now - aTime) < 24 * 60 * 60 * 1000 ? 1.2 : 1.0
    const bTimeWeight = (now - bTime) < 24 * 60 * 60 * 1000 ? 1.2 : 1.0
    
    // 4. 가중치 적용된 점수 계산
    const aWeightedScore = aScore * aTimeWeight
    const bWeightedScore = bScore * bTimeWeight
    
    // 5. 점수 차이가 크면 점수 순, 비슷하면 좋아요 수 순, 그것도 비슷하면 최신순
    if (Math.abs(aWeightedScore - bWeightedScore) > 2) {
      return bWeightedScore - aWeightedScore
    }
    if (aLikes !== bLikes) {
      return bLikes - aLikes
    }
    return bTime - aTime
  })

  const handleLike = async () => {
    if (!post?.id || !user) {
      toast({ title: '로그인이 필요합니다', description: '공감은 로그인 후 이용할 수 있어요.' })
      return
    }

    // 낙관적 업데이트 (즉시 반응성)
    const wasLiked = isLiked
    setIsLiked(!wasLiked)
    setLikeCount(prev => prev + (wasLiked ? -1 : 1))
    setPost((p: any) => ({ ...p, likes_count: Math.max(0, (p?.likes_count || 0) + (wasLiked ? -1 : 1)) }))

    try {
      if (wasLiked) {
        // 기존 like 제거
        const { data: existing } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like')
          .maybeSingle()

        if (existing?.id) {
          await supabase.from('post_reactions').delete().eq('id', existing.id)
        }
      } else {
        // like 추가
        const { error: insertError } = await supabase.from('post_reactions').insert({
          post_id: post.id,
          user_id: user.id,
          reaction_type: 'like',
        })
        if (insertError && insertError.code !== '23505') {
          // 23505는 UNIQUE 제약 위반 (이미 존재하는 좋아요) - 무시
          throw insertError
        }
      }
      // 서버 기준 최신 카운트로 동기화 (페이지 이탈 후 0으로 보이는 현상 방지)
      try {
        const { count } = await supabase
          .from('post_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('reaction_type', 'like')
        if (typeof count === 'number') {
          setLikeCount(count)
          setPost((p: any) => ({ ...p, likes_count: count }))
        }
      } catch {}
    } catch (e) {
      // 서버 실패 시 UI 되돌림
      setIsLiked(wasLiked)
      setLikeCount(prev => prev + (wasLiked ? 1 : -1))
      setPost((p: any) => ({ ...p, likes_count: Math.max(0, (p?.likes_count || 0) + (wasLiked ? 1 : -1)) }))
    }
  }

  const handleScrap = () => {
    if (!post?.id) return
    if (!user) {
      toast({ title: '로그인이 필요합니다', description: '스크랩은 로그인 후 이용할 수 있어요.' })
      return
    }
    
    // 낙관적 업데이트 (즉시 반응성)
    const wasScrapped = isScrapped
    const next = !wasScrapped
    setIsScrapped(next)
    setScrapCount(prev => prev + (next ? 1 : -1))
    setPost((p: any) => ({ ...p, scraps_count: Math.max(0, (p?.scraps_count || 0) + (next ? 1 : -1)) }))
    
    try {
      const ids = new Set<string>(JSON.parse(localStorage.getItem('scrappedPostIds') || '[]'))
      if (next) ids.add(post.id); else ids.delete(post.id)
      localStorage.setItem('scrappedPostIds', JSON.stringify(Array.from(ids)))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scrap-updated'))
      }
    } catch {}

    // 서버 반영 (로그인+UUID일 때만)
    if (user && isUuid(post.id)) {
      ;(async () => {
        try {
          if (next) {
            await supabase.from('scraps').insert({ post_id: post.id, user_id: user.id })
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('scrap-updated'))
            }
          } else {
            const { data: existing } = await supabase
              .from('scraps')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle()
            if (existing?.id) {
              await supabase.from('scraps').delete().eq('id', existing.id)
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('scrap-updated'))
            }
          }
        } catch {
          // 서버 실패 시 UI 되돌림
          setIsScrapped(wasScrapped)
          setScrapCount(prev => prev + (wasScrapped ? 1 : -1))
          setPost((p: any) => ({ ...p, scraps_count: Math.max(0, (p?.scraps_count || 0) + (wasScrapped ? 1 : -1)) }))
        }
      })()
    }
  }

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>목록으로</span>
          </Link>
          <div className="text-sm text-gray-500" suppressHydrationWarning>
            {formatDate(post.created_at)}
          </div>
        </div>
      </div>

      {/* 게시글 내용 */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* 게시글 헤더 */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium mr-3">
              <span className="text-sm font-bold">A</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">익명 사용자</div>
              <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
            </div>
            <div className="ml-auto relative">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPostMenuOpen(v => !v)}>
                <MoreVertical className="w-5 h-5" />
              </Button>
              {postMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-md border bg-white shadow-md z-10">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { setReportOpen(true); setPostMenuOpen(false) }}
                  >
                    <Flag className="w-4 h-4" /> 신고
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 게시글 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

          {/* 게시글 내용 */}
          <div className="text-gray-700 leading-relaxed mb-6">
            {post.content}
          </div>

          {/* 게시글 반응 버튼 */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-2 min-h-[44px] px-4 transition-colors ${
                  isLiked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : 'text-gray-600'}`} />
                <span className={isLiked ? 'text-red-500' : 'text-gray-600'}>공감</span>
                <span className={`text-sm font-medium ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleScrap}
                className={`flex items-center space-x-2 min-h-[44px] px-4 transition-colors ${
                  isScrapped ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-50'
                }`}
              >
                <BookmarkIcon className={`w-5 h-5 ${isScrapped ? 'fill-current text-yellow-500' : 'text-gray-600'}`} />
                <span className={isScrapped ? 'text-yellow-500' : 'text-gray-600'}>스크랩</span>
                <span className={`text-sm font-medium ${isScrapped ? 'text-yellow-500' : 'text-gray-600'}`}>{scrapCount}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">댓글 ({comments?.length || 0})</h3>
          
          {/* 댓글 작성 폼 */}
          <div className="mb-6">
            <CreateCommentForm postId={post.id} onPosted={() => {
              if (!isUuid(post.id)) return
              supabase
                .from('comments')
                .select('*')
                .eq('post_id', post.id)
                .order('created_at', { ascending: true })
                .then(({ data }) => { if (data) setComments(data) })
            }} />
          </div>

          {/* 댓글 목록 */}
          <div className="mt-6 space-y-3">
            {sortedComments.map((comment, index) => {
              const score = (comment?.likes_count ?? 0) - (comment?.dislikes_count ?? 0)
              const isBest = score >= 5 && index < 3 // 상위 3개 중 점수 5 이상
              const isHot = score >= 3 && score < 5 && index < 5 // 상위 5개 중 점수 3-4
              
              return (
                <div key={comment.id} className={`py-3 px-4 rounded-lg ${
                  isBest ? 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-sm' : 
                  isHot ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 shadow-sm' : 
                  'bg-gray-50 border border-gray-100'
                }`}>
                  {isBest && (
                    <div className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full mb-3 font-bold shadow-md">
                      🔥 BEST
                    </div>
                  )}
                  {isHot && !isBest && (
                    <div className="inline-block bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-3 py-1.5 rounded-full mb-3 font-medium shadow-md">
                      ⭐ HOT
                    </div>
                  )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium mr-2">
                        <span className="text-xs font-bold">{comment?.is_anonymous === false ? 'U' : 'A'}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {comment?.is_anonymous === false
                          ? (
                              // 내 댓글이면 세션 정보 우선 사용, 그 외엔 profiles 맵 → 이메일 접두 → 기본값
                              (comment.user_id === user?.id
                                ? (user?.user_metadata?.nickname || user?.email?.split('@')[0] || '사용자')
                                : (userIdToProfile?.[comment.user_id]?.nickname
                                    || userIdToProfile?.[comment.user_id]?.email?.split('@')[0]
                                    || '사용자')
                              )
                            )
                          : `익명${typeof comment.anonymous_number === 'number' ? comment.anonymous_number : ''}`}
                      </div>
                      <span className="text-xs text-gray-400 ml-2" suppressHydrationWarning>
                        {formatDate(comment.created_at)}
                      </span>
                      <div className="ml-auto relative">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpenCommentMenuId(prev => prev === comment.id ? null : comment.id)}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {openCommentMenuId === comment.id && (
                          <div className="absolute right-0 mt-2 w-32 rounded-md border bg-white shadow-md z-10">
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              onClick={() => { setReportCommentId(comment.id); setOpenCommentMenuId(null) }}
                            >
                              <Flag className="w-4 h-4" /> 신고
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                </div>

                {/* 댓글 반응 버튼 */}
                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center ${userReactionByCommentId[comment.id] === 'like' ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-600 hover:text-blue-500'}`}
                    onClick={async () => {
                      if (!user) return
                      if (pendingReactions[comment.id]) return
                      setPendingReactions(prev => ({ ...prev, [comment.id]: true }))
                      if (!user) return
                      // 기존 반응(같은 유저) 조회 후 전환/토글
                      const { data: existing } = await supabase
                        .from('comment_reactions')
                        .select('*')
                        .eq('comment_id', comment.id)
                        .eq('user_id', user.id)
                        .maybeSingle()

                      if (existing?.id) {
                        if (existing.reaction_type === 'like') {
                          // 같은 타입 → 해제
                          await supabase.from('comment_reactions').delete().eq('id', existing.id)
                          setComments(prev => prev.map(c => c.id === comment.id ? { ...c, likes_count: Math.max(0, (c.likes_count || 0) - 1) } : c))
                          setUserReactionByCommentId(prev => ({ ...prev, [comment.id]: null }))
                        } else {
                          // 반대 타입(dislike) → like로 전환
                          await supabase.from('comment_reactions').update({ reaction_type: 'like' }).eq('id', existing.id)
                          setComments(prev => prev.map(c => c.id === comment.id ? {
                            ...c,
                            dislikes_count: Math.max(0, (c.dislikes_count || 0) - 1),
                            likes_count: (c.likes_count || 0) + 1,
                          } : c))
                          setUserReactionByCommentId(prev => ({ ...prev, [comment.id]: 'like' }))
                        }
                      } else {
                        // 새 like
                        await supabase.from('comment_reactions').insert({ comment_id: comment.id, user_id: user.id, reaction_type: 'like' })
                        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c))
                        setUserReactionByCommentId(prev => ({ ...prev, [comment.id]: 'like' }))
                      }
                      setPendingReactions(prev => ({ ...prev, [comment.id]: false }))
                    }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">{comment.likes_count}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center ${userReactionByCommentId[comment.id] === 'dislike' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-gray-600 hover:text-red-500'}`}
                    onClick={async () => {
                      if (!user) return
                      if (pendingReactions[comment.id]) return
                      setPendingReactions(prev => ({ ...prev, [comment.id]: true }))
                      if (!user) return
                      const { data: existing } = await supabase
                        .from('comment_reactions')
                        .select('*')
                        .eq('comment_id', comment.id)
                        .eq('user_id', user.id)
                        .maybeSingle()

                      if (existing?.id) {
                        if (existing.reaction_type === 'dislike') {
                          // 같은 타입 → 해제
                          await supabase.from('comment_reactions').delete().eq('id', existing.id)
                          setComments(prev => prev.map(c => c.id === comment.id ? { ...c, dislikes_count: Math.max(0, (c.dislikes_count || 0) - 1) } : c))
                          setUserReactionByCommentId(prev => ({ ...prev, [comment.id]: null }))
                        } else {
                          // 반대 타입(like) → dislike로 전환
                          await supabase.from('comment_reactions').update({ reaction_type: 'dislike' }).eq('id', existing.id)
                          setComments(prev => prev.map(c => c.id === comment.id ? {
                            ...c,
                            likes_count: Math.max(0, (c.likes_count || 0) - 1),
                            dislikes_count: (c.dislikes_count || 0) + 1,
                          } : c))
                          setUserReactionByCommentId(prev => ({ ...prev, [comment.id]: 'dislike' }))
                        }
                      } else {
                        // 새 dislike
                        await supabase.from('comment_reactions').insert({ comment_id: comment.id, user_id: user.id, reaction_type: 'dislike' })
                        setComments(prev => prev.map(c => c.id === comment.id ? { ...c, dislikes_count: (c.dislikes_count || 0) + 1 } : c))
                        setUserReactionByCommentId(prev => ({ ...prev, [comment.id]: 'dislike' }))
                      }
                      setPendingReactions(prev => ({ ...prev, [comment.id]: false }))
                    }}
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    <span className="text-sm">{comment.dislikes_count}</span>
                  </Button>
                  {/* 신고는 우측 상단 케밥 메뉴로 이동 */}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      </div>
      {reportOpen && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="post"
          targetId={post.id}
        />
      )}
      {reportCommentId && (
        <ReportModal
          open={!!reportCommentId}
          onClose={() => setReportCommentId(null)}
          targetType="comment"
          targetId={reportCommentId}
        />
      )}
    </div>
  )
}
