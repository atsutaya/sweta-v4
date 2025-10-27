'use client'

import { useState } from 'react'
import { useSupabase } from './supabase-provider'
import { Button } from './ui/button'
import { useQueryClient } from '@tanstack/react-query'

interface CreateCommentFormProps {
  postId: string
  parentId?: string
  onCancel?: () => void
  onPosted?: () => void
}

export function CreateCommentForm({ postId, parentId, onCancel, onPosted }: CreateCommentFormProps) {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, supabase } = useSupabase()
  const queryClient = useQueryClient()

  const isUuid = (value: string) => /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // 익명 번호 생성 (간단한 해시 기반)
      let hash = 0
      const str = user.id + postId
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      const anonymousNumber = Math.abs(hash) % 1000 + 1

      // 댓글 INSERT (is_anonymous 컬럼이 존재하면 함께 기록, 없으면 폴백)
      // 서버에 없는 로컬 작성 글(비-UUID) 또는 존재하지 않는 게시글 ID인 경우: 로컬로만 저장
      if (!isUuid(postId)) {
        const newComment = {
          id: Date.now().toString(),
          post_id: postId,
          content,
          user_id: user.id,
          parent_id: parentId || null,
          anonymous_number: isAnonymous ? (Math.abs((user.id + postId).split('').reduce((h,c)=>((h<<5)-h)+c.charCodeAt(0),0)) % 1000 + 1) : null,
          likes_count: 0,
          dislikes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        try {
          const local = JSON.parse(localStorage.getItem('sampleComments') || '[]')
          local.push(newComment)
          localStorage.setItem('sampleComments', JSON.stringify(local))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('comment-created', { detail: { postId } }))
            window.dispatchEvent(new CustomEvent('post-updated', { detail: { postId } }))
          }
        } catch {}
        setContent('')
        setIsAnonymous(true)
        onCancel?.()
        onPosted?.()
        queryClient.invalidateQueries({ queryKey: ['comments', postId] })
        queryClient.invalidateQueries({ queryKey: ['post', postId] })
        queryClient.invalidateQueries({ queryKey: ['posts'] })
        return
      }
      // 서버 게시글 존재 확인 (FK 위반 방지)
      const { data: postExists } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .maybeSingle()
      if (!postExists) {
        const newComment = {
          id: Date.now().toString(),
          post_id: postId,
          content,
          user_id: user.id,
          parent_id: parentId || null,
          anonymous_number: isAnonymous ? anonymousNumber : null,
          likes_count: 0,
          dislikes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        try {
          const local = JSON.parse(localStorage.getItem('sampleComments') || '[]')
          local.push(newComment)
          localStorage.setItem('sampleComments', JSON.stringify(local))
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('comment-created', { detail: { postId } }))
            window.dispatchEvent(new CustomEvent('post-updated', { detail: { postId } }))
          }
        } catch {}
        setContent('')
        setIsAnonymous(true)
        onCancel?.()
        onPosted?.()
        queryClient.invalidateQueries({ queryKey: ['comments', postId] })
        queryClient.invalidateQueries({ queryKey: ['post', postId] })
        queryClient.invalidateQueries({ queryKey: ['posts'] })
        return
      }
      try {
        const { error: insertErr1 } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            content,
            user_id: user.id,
            parent_id: parentId || null,
            anonymous_number: anonymousNumber,
            is_anonymous: isAnonymous,
            likes_count: 0,
            dislikes_count: 0,
          } as any)
        if (insertErr1) throw insertErr1
      } catch (e) {
        const { error: insertErr2 } = await supabase
          .from('comments')
          .insert({
            post_id: postId,
            content,
            user_id: user.id,
            parent_id: parentId || null,
            anonymous_number: anonymousNumber,
            likes_count: 0,
            dislikes_count: 0,
          } as any)
        if (insertErr2) throw insertErr2
      }

      // 댓글 카운트는 DB 트리거에서 자동 갱신(직접 업데이트 제거)

      // 전역 이벤트 브로드캐스트로 다른 화면 갱신 유도
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('comment-created', { detail: { postId } }))
          window.dispatchEvent(new CustomEvent('post-updated', { detail: { postId } }))
        }
      } catch {}

      setContent('')
      setIsAnonymous(true)
      onCancel?.()
      onPosted?.()
      
      // 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        로그인하여 댓글을 남겨보세요
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder={parentId ? '답글을 입력하세요...' : '댓글을 입력하세요...'}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            id="isAnonymous"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="isAnonymous">익명으로 작성</label>
        </div>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            size="sm"
          >
            {loading ? '작성 중...' : (parentId ? '답글 달기' : '댓글 달기')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
    </form>
  )
}
