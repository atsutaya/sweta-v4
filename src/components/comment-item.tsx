'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { Button } from './ui/button'
import { ThumbsUp, ThumbsDown, Flag, MessageSquare, Edit, Trash2 } from 'lucide-react'
import { ReportModal } from './report-modal'
import { toast } from '@/hooks/use-toast'
import { useSupabase } from './supabase-provider'
import { useQueryClient } from '@tanstack/react-query'
import { CreateCommentForm } from './create-comment-form'
import { Database } from '@/lib/supabase'

type Comment = Database['public']['Tables']['comments']['Row']

interface CommentItemProps {
  comment: Comment
  postId: string
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [loading, setLoading] = useState(false)
  const { user } = useSupabase()
  const queryClient = useQueryClient()
  const [reportOpen, setReportOpen] = useState(false)

  // 답글 목록 조회
  const { data: replies } = useQuery({
    queryKey: ['comment-replies', comment.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
  })

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) return

    setLoading(true)
    try {
      // 기존 반응(타입 무관) 확인 (중복 레코드가 있을 수 있으니 전부 조회)
      const { data: existingReactions } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('comment_id', comment.id)
        .eq('user_id', user.id)

      const existingReaction = existingReactions && existingReactions.length > 0 ? existingReactions[0] : null
      const opposite: 'like' | 'dislike' = type === 'like' ? 'dislike' : 'like'

      // 데이터 정합성: 동일 유저-댓글에 2개 레코드가 있으면 반대 타입 모두 제거
      if (existingReactions && existingReactions.length > 1) {
        const toRemoveIds = existingReactions
          .filter(r => r.reaction_type !== type)
          .map(r => r.id)
        if (toRemoveIds.length > 0) {
          await supabase.from('comment_reactions').delete().in('id', toRemoveIds)
        }
      }

      if (existingReaction) {
        if (existingReaction.reaction_type === type) {
          // 같은 타입이면 토글 해제
          await supabase.from('comment_reactions').delete().eq('id', existingReaction.id)
          const updateData = {
            [`${type}s_count`]: Math.max(0, (comment as any)[`${type}s_count`] - 1),
          } as any
          await supabase.from('comments').update(updateData).eq('id', comment.id)
        } else {
          // 반대 타입에서 전환: 반대 -1, 현재 +1
          await supabase
            .from('comment_reactions')
            .update({ reaction_type: type })
            .eq('id', existingReaction.id)

          const updateData = {
            [`${opposite}s_count`]: Math.max(0, (comment as any)[`${opposite}s_count`] - 1),
            [`${type}s_count`]: (comment as any)[`${type}s_count`] + 1,
          } as any
          await supabase.from('comments').update(updateData).eq('id', comment.id)
        }
      } else {
        // 반대 타입이 남아있지 않도록 정리 후 새 반응 추가
        await supabase.from('comment_reactions').insert({
          comment_id: comment.id,
          user_id: user.id,
          reaction_type: type,
        })
        const updateData = {
          [`${type}s_count`]: (comment as any)[`${type}s_count`] + 1,
        } as any
        await supabase.from('comments').update(updateData).eq('id', comment.id)
      }

      // 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['comment-replies', comment.id] })
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    } catch (error) {
      console.error('반응 처리 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id)

      if (error) throw error

      setShowEditForm(false)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    } catch (error) {
      console.error('댓글 수정 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !confirm('댓글을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)

      if (error) throw error

      // 댓글 수 감소
      await supabase
        .from('posts')
        .update({
          comments_count: supabase.rpc('decrement', { row_id: postId, column_name: 'comments_count' })
        })
        .eq('id', postId)

      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch (error) {
      console.error('댓글 삭제 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReport = () => setReportOpen(true)

  const isAuthor = user?.id === comment.user_id
  const displayName = (comment as any)?.is_anonymous !== false
    ? `익명${comment.anonymous_number ?? ''}`
    : (comment as any)?.user_display_name || '사용자'

  if (showEditForm) {
    return (
      <div className="border border-border rounded-lg p-4">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleEdit}
            disabled={loading}
          >
            {loading ? '수정 중...' : '수정'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditForm(false)}
          >
            취소
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{displayName}</span>
          <span className="text-sm text-muted-foreground" suppressHydrationWarning>
            {formatDate(comment.created_at)}
          </span>
        </div>
        {isAuthor && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditForm(true)}
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="h-8 w-8 p-0 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <p className="mb-3 whitespace-pre-wrap">{comment.content}</p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction('like')}
          disabled={loading}
          className="h-8 px-2"
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          {comment.likes_count}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleReaction('dislike')}
          disabled={loading}
          className="h-8 px-2"
        >
          <ThumbsDown className="w-4 h-4 mr-1" />
          {comment.dislikes_count}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="h-8 px-2"
        >
          <MessageSquare className="w-4 h-4 mr-1" />
          답글
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleReport}
          className="h-8 px-2 text-muted-foreground hover:text-destructive"
        >
          <Flag className="w-4 h-4 mr-1" />
          신고
        </Button>
      </div>

      {showReplyForm && (
        <div className="mt-3 pt-3 border-t">
          <CreateCommentForm
            postId={postId}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {replies && replies.length > 0 && (
        <div className="mt-3 ml-6 space-y-3">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      )}

      {reportOpen && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="comment"
          targetId={comment.id}
        />
      )}
    </div>
  )
}
