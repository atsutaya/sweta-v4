'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { Button } from './ui/button'
import { CommentSection } from './comment-section'
import { PostActions } from './post-actions'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useSupabase } from './supabase-provider'

interface PostDetailProps {
  postId: string
}

export function PostDetail({ postId }: PostDetailProps) {
  const { user } = useSupabase()

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()
      
      if (error) throw error
      return data
    },
  })

  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>게시글을 불러올 수 없습니다.</div>
  if (!post) return <div>게시글이 존재하지 않습니다.</div>

  const isAuthor = user?.id === post.user_id

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
        </Link>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              {post.is_pinned && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  고정
                </span>
              )}
              {post.is_notice && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  공지
                </span>
              )}
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                {post.category}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(post.created_at)}
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
          
          <div className="prose max-w-none mb-6">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <span>👍 {post.likes_count}</span>
              <span>👎 {post.dislikes_count}</span>
              <span>💬 {post.comments_count}</span>
            </div>
            <span>익명</span>
          </div>

          <PostActions post={post} />

          {isAuthor && (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                수정
              </Button>
              <Button variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                삭제
              </Button>
            </div>
          )}
        </div>
      </div>

      <CommentSection postId={postId} />
    </div>
  )
}
