'use client'

import { useState } from 'react'
import { useSupabase } from './supabase-provider'
import { Button } from './ui/button'
import { ThumbsUp, ThumbsDown, Flag } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { checkAndBlindPost } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface PostActionsProps {
  post: {
    id: string
    likes_count: number
    dislikes_count: number
  }
}

export function PostActions({ post }: PostActionsProps) {
  const { user, supabase } = useSupabase()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) return

    setLoading(true)
    try {
      // 기존 반응 확인
      const { data: existingReaction } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('reaction_type', type)
        .single()

      if (existingReaction) {
        // 기존 반응 제거
        await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existingReaction.id)
      } else {
        // 새 반응 추가
        await supabase
          .from('post_reactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: type
          })
      }

             // 자동 블라인드 체크
       if (type === 'dislike') {
         await checkAndBlindPost(post.id)
       }

       // 쿼리 무효화
       queryClient.invalidateQueries({ queryKey: ['post', post.id] })
       queryClient.invalidateQueries({ queryKey: ['posts'] })
     } catch (error) {
       console.error('반응 처리 중 오류:', error)
     } finally {
       setLoading(false)
     }
   }

  const handleReport = async () => {
    if (!user) return

    const reason = prompt('신고 사유를 입력해주세요:')
    if (!reason) return

    try {
      await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_type: 'post',
          target_id: post.id,
          reason,
          status: 'pending'
        })
      toast({ title: '신고 접수', description: '신고가 접수되었습니다.' })
    } catch (error) {
      console.error('신고 처리 중 오류:', error)
      toast({ title: '오류', description: '신고 처리 중 오류가 발생했습니다.', variant: 'destructive' })
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        로그인하여 반응을 남겨보세요
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction('like')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <ThumbsUp className="w-4 h-4" />
        좋아요 ({post.likes_count})
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleReaction('dislike')}
        disabled={loading}
        className="flex items-center gap-2"
      >
        <ThumbsDown className="w-4 h-4" />
        싫어요 ({post.dislikes_count})
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleReport}
        className="flex items-center gap-2 text-muted-foreground hover:text-destructive"
      >
        <Flag className="w-4 h-4" />
        신고
      </Button>
    </div>
  )
}
