'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useSupabase } from './supabase-provider'

interface CommentFormProps {
  postId: string
  onPosted?: () => void
}

export function CommentForm({ postId, onPosted }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    
    try {
      if (!user) {
        toast({ title: '로그인이 필요합니다' })
        return
      }
      const { error: rpcError } = await supabase.rpc('insert_comment_with_anonymous_number', {
        p_post_id: postId,
        p_content: content.trim(),
      })

      if (rpcError) {
        // RPC 실패 시 직접 insert 폴백 (익명 번호 간단 생성)
        let hash = 0
        const str = `${user.id}:${postId}:${Date.now()}`
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash
        }
        const anonymousNumber = Math.abs(hash) % 1000 + 1

        const { error: insertError } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            content: content.trim(),
            user_id: user.id,
            parent_id: null,
            anonymous_number: anonymousNumber,
            likes_count: 0,
            dislikes_count: 0,
          })
        if (insertError) throw insertError
      }
      toast({ title: '댓글이 작성되었습니다' })
      setContent('')
      onPosted?.()
    } catch (error) {
      toast({ title: '댓글 작성 실패', description: '잠시 후 다시 시도해주세요.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring text-base min-h-[100px] sm:min-h-[120px]"
          rows={3}
          maxLength={500}
          style={{ fontSize: '16px' }} // iOS 줌 방지
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">
            익명으로 작성됩니다
          </span>
          <span className="text-xs text-muted-foreground">
            {content.length}/500
          </span>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!content.trim() || isSubmitting}
          size="sm"
          className="min-h-[44px] px-6 text-base w-full sm:w-auto"
        >
          {isSubmitting ? (
            '작성 중...'
          ) : (
            '댓글 작성'
          )}
        </Button>
      </div>
    </form>
  )
}
