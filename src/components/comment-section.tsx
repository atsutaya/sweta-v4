'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CommentList } from './comment-list'
import { CreateCommentForm } from './create-comment-form'

interface CommentSectionProps {
  postId: string
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
  })

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">댓글</h3>
      
      <CreateCommentForm postId={postId} />
      
      <div className="mt-6">
        {isLoading ? (
          <div>댓글을 불러오는 중...</div>
        ) : comments && comments.length > 0 ? (
          <CommentList comments={comments} postId={postId} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            첫 번째 댓글을 남겨보세요!
          </div>
        )}
      </div>
    </div>
  )
}
