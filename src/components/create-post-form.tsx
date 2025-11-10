'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from './supabase-provider'
import { Button } from './ui/button'
// 주의: 인증이 연결된 Supabase 클라이언트를 컨텍스트에서 사용해야 RLS 허용됨
import { toast } from '@/hooks/use-toast'

const categories = [
  { id: '자유', name: '자유' },
  { id: '질문', name: '질문' },
  { id: '정보', name: '정보' },
  { id: '고민', name: '고민' },
  { id: '공지', name: '공지' },
]

export function CreatePostForm() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('자유')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, supabase } = useSupabase()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (loading) return

    setLoading(true)
    setError('')

    try {
      // 권장 경로: SECURITY DEFINER RPC 사용 (insert_post_with_auth)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('insert_post_with_auth', {
        p_title: title.trim(),
        p_content: content.trim(),
        p_category: category,
      })
      if (rpcError || !rpcResult?.id) {
        // 폴백 1: 직접 insert 시도 (RLS 허용 가정)
        const { data: directRows, error: directErr } = await supabase
          .from('posts')
          .insert({
            title: title.trim(),
            content: content.trim(),
            category,
            user_id: user.id,
          })
          .select('id')
          .maybeSingle()
        if (directErr || !directRows?.id) throw (rpcError || directErr || new Error('insert failed'))
        const insertedId = directRows.id as string
        try {
          const cached = JSON.parse(localStorage.getItem('samplePosts') || '[]')
          const nowIso = new Date().toISOString()
          const cachePost = {
            id: insertedId,
            title: title.trim(),
            content: content.trim(),
            category,
            user_id: user.id,
            created_at: nowIso,
            updated_at: nowIso,
            likes_count: 0,
            dislikes_count: 0,
            comments_count: 0,
            is_blinded: false,
            is_pinned: false,
            is_notice: false,
            scraps_count: 0,
          }
          localStorage.setItem('samplePosts', JSON.stringify([cachePost, ...cached]))
        } catch {}
        toast({ title: '작성 완료', description: '게시글이 등록되었습니다.' })
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('post-created'))
          }
        } catch {}
        router.push(`/posts/${insertedId}`)
        return
      }
      const insertedId: string | undefined = rpcResult?.id
      try {
        const cached = JSON.parse(localStorage.getItem('samplePosts') || '[]')
        const nowIso = new Date().toISOString()
        const cachePost = {
          id: insertedId,
          title: title.trim(),
          content: content.trim(),
          category,
          user_id: user.id,
          created_at: nowIso,
          updated_at: nowIso,
          likes_count: 0,
          dislikes_count: 0,
          comments_count: 0,
          is_blinded: false,
          is_pinned: false,
          is_notice: false,
          scraps_count: 0,
        }
        localStorage.setItem('samplePosts', JSON.stringify([cachePost, ...cached]))
      } catch {}
      toast({ title: '작성 완료', description: '게시글이 등록되었습니다.' })
      try {
        // 홈 목록 최신화 신호
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('post-created'))
        }
      } catch {}
      router.push(`/posts/${insertedId}`)
      return
    } catch (error: any) {
      toast({ title: '작성 실패', description: '네트워크/권한 문제로 로컬에 저장합니다.' })
      // 실패 시 로컬 폴백 저장 후 상세로 이동
      const newPost = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        category,
        user_id: user?.id || 'sample-user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes_count: 0,
        dislikes_count: 0,
        comments_count: 0,
        is_blinded: false,
        is_pinned: false,
        is_notice: false,
        scraps_count: 0,
      }
      const existingPosts = JSON.parse(localStorage.getItem('samplePosts') || '[]')
      existingPosts.unshift(newPost)
      localStorage.setItem('samplePosts', JSON.stringify(existingPosts))
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('post-created'))
        }
      } catch {}
      router.push(`/posts/${newPost.id}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>로그인이 필요합니다.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          카테고리
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="제목을 입력하세요"
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="내용을 입력하세요"
          required
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={loading}
          className={`flex-1 transition-colors ${loading ? 'bg-muted text-muted-foreground hover:bg-muted focus-visible:ring-muted' : ''}`}
        >
          {loading ? '작성 중...' : '작성하기'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
