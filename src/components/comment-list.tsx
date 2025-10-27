'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CommentItem } from './comment-item'
import { Database } from '@/lib/supabase'

type Comment = Database['public']['Tables']['comments']['Row']

interface CommentListProps {
  comments: Comment[]
  postId: string
}

export function CommentList({ comments, postId }: CommentListProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
    </div>
  )
}
