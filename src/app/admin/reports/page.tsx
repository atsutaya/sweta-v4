'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type ReportRow = {
  id: string
  target_type: 'post' | 'comment'
  target_id: string
  reporter_id: string
  reason: string | null
  status: 'pending' | 'reviewed' | 'rejected'
  created_at: string
}

export default function AdminReportsPage() {
  const { user, supabase } = useSupabase()
  const [role, setRole] = useState<string>('user')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ReportRow[]>([])
  const [activeTab, setActiveTab] = useState<'reports' | 'blocks'>('reports')
  const [reporterEmailMap, setReporterEmailMap] = useState<Record<string, string>>({})
  const [authorEmailByUserId, setAuthorEmailByUserId] = useState<Record<string, string>>({})
  const [postAuthorIdByPostId, setPostAuthorIdByPostId] = useState<Record<string, string>>({})
  const [commentAuthorIdByCommentId, setCommentAuthorIdByCommentId] = useState<Record<string, string>>({})
  const [updating, setUpdating] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<any[]>([])
  const [blockEmail, setBlockEmail] = useState('')
  const [unblockEmail, setUnblockEmail] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        if (!user) return
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        setRole((profile as any)?.role ?? 'user')
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  useEffect(() => {
    ;(async () => {
      if (!user) return
      if (role !== 'admin') return
      let list: any[] = []
      if (activeTab === 'reports') {
        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
        list = (data as any) || []
        setRows(list)
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id,email,role,is_blocked')
          .eq('is_blocked', true)
          .order('email', { ascending: true })
        setBlockedUsers((data as any) || [])
        setRows([])
        // 차단 탭에서는 신고 메타 구성 스킵
        return
      }

      // 1) 신고자 이메일 맵 구성
      const reporterIds = Array.from(new Set(list.map((r: any) => r.reporter_id).filter(Boolean)))
      if (reporterIds.length > 0) {
        const { data: reporters } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', reporterIds)
        const map: Record<string, string> = {}
        for (const p of (reporters as any[]) || []) {
          map[p.id] = p.email
        }
        setReporterEmailMap(map)
      } else {
        setReporterEmailMap({})
      }

      // 2) 대상 작성자 이메일 맵 구성
      const postIds = list.filter((r: any) => r.target_type === 'post').map((r: any) => r.target_id)
      const commentIds = list.filter((r: any) => r.target_type === 'comment').map((r: any) => r.target_id)
      const authorIds: string[] = []
      const postMap: Record<string, string> = {}
      const commentMap: Record<string, string> = {}
      if (postIds.length > 0) {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, user_id')
          .in('id', postIds)
        for (const p of (posts as any[]) || []) { authorIds.push(p.user_id); postMap[p.id] = p.user_id }
      }
      if (commentIds.length > 0) {
        const { data: comments } = await supabase
          .from('comments')
          .select('id, user_id')
          .in('id', commentIds)
        for (const c of (comments as any[]) || []) { authorIds.push(c.user_id); commentMap[c.id] = c.user_id }
      }
      setPostAuthorIdByPostId(postMap)
      setCommentAuthorIdByCommentId(commentMap)
      const uniqueAuthorIds = Array.from(new Set(authorIds.filter(Boolean)))
      if (uniqueAuthorIds.length > 0) {
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', uniqueAuthorIds)
        const amap: Record<string, string> = {}
        for (const a of (authors as any[]) || []) {
          amap[a.id] = a.email
        }
        setAuthorEmailByUserId(amap)
      } else {
        setAuthorEmailByUserId({})
      }
    })()
  }, [user, role, activeTab])

  const rejectReport = async (id: string) => {
    if (role !== 'admin') return
    setUpdating(id)
    try {
      // 1) 가능한 경우 reviewed로 표시 (실패해도 무시)
      await supabase.from('reports').update({ status: 'reviewed' }).eq('id', id)
      // 2) 신고 행 자체 삭제 (목록에서 제거 목적)
      await supabase.from('reports').delete().eq('id', id)
      setRows(prev => prev.filter(r => r.id !== id))
    } finally {
      setUpdating(null)
    }
  }

  const deleteTarget = async (r: ReportRow) => {
    if (role !== 'admin') return
    setUpdating(r.id)
    try {
      if (r.target_type === 'post') {
        const { error } = await supabase.from('posts').delete().eq('id', r.target_id)
        if (error) {
          console.error('게시글 삭제 실패:', error)
          alert(`게시글 삭제 실패: ${error.message}`)
          return
        }
        console.log('게시글 삭제 성공:', r.target_id)
      } else {
        const { error } = await supabase.from('comments').delete().eq('id', r.target_id)
        if (error) {
          console.error('댓글 삭제 실패:', error)
          alert(`댓글 삭제 실패: ${error.message}`)
          return
        }
        console.log('댓글 삭제 성공:', r.target_id)
      }
      
      // 삭제 성공 후 신고 상태 업데이트
      const { error: updateError } = await supabase.from('reports').update({ status: 'reviewed' }).eq('id', r.id)
      if (updateError) {
        console.error('신고 상태 업데이트 실패:', updateError)
      }
      
      setRows(prev => prev.filter(x => x.id !== r.id))
    } catch (error: any) {
      console.error('삭제 중 오류:', error)
      alert(`삭제 중 오류 발생: ${error.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const blockUser = async (userId: string) => {
    if (role !== 'admin') return
    setUpdating(userId)
    try {
      await supabase.from('profiles').update({ is_blocked: true }).eq('id', userId)
      setBlockedUsers(prev => {
        const exists = prev.some((u: any) => u.id === userId)
        if (exists) return prev
        const email = authorEmailByUserId[userId] || reporterEmailMap[userId] || ''
        return [...prev, { id: userId, email, is_blocked: true }]
      })
    } finally {
      setUpdating(null)
    }
  }

  const unblockUser = async (userId: string) => {
    if (role !== 'admin') return
    setUpdating(userId)
    try {
      await supabase.from('profiles').update({ is_blocked: false }).eq('id', userId)
      setBlockedUsers(prev => prev.filter((u: any) => u.id !== userId))
    } finally {
      setUpdating(null)
    }
  }

  const blockByEmail = async () => {
    if (role !== 'admin') return
    const email = blockEmail.trim().toLowerCase()
    if (!email) return
    setUpdating('block-email')
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id,email,is_blocked')
        .eq('email', email)
        .maybeSingle()
      if (!prof?.id) {
        setUpdating(null)
        return
      }
      await supabase.from('profiles').update({ is_blocked: true }).eq('id', prof.id)
      setBlockedUsers(prev => {
        const exists = prev.some((u: any) => u.id === prof.id)
        return exists ? prev : [...prev, { id: prof.id, email: prof.email, is_blocked: true }]
      })
      setBlockEmail('')
    } finally {
      setUpdating(null)
    }
  }

  const unblockByEmail = async () => {
    if (role !== 'admin') return
    const email = unblockEmail.trim().toLowerCase()
    if (!email) return
    setUpdating('unblock-email')
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id,email,is_blocked')
        .eq('email', email)
        .maybeSingle()
      if (!prof?.id) { setUpdating(null); return }
      await supabase.from('profiles').update({ is_blocked: false }).eq('id', prof.id)
      setBlockedUsers(prev => prev.filter((u: any) => u.id !== prof.id))
      setUnblockEmail('')
    } finally {
      setUpdating(null)
    }
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-lg p-6 text-center">
          로그인 후 이용해주세요.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-lg p-6 text-center">불러오는 중...</div>
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="border rounded-lg p-6 text-center">접근 권한이 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">관리자</h1>
          <Link href="/" className="text-sm underline">홈으로</Link>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={activeTab === 'reports' ? 'default' : 'outline'} onClick={() => setActiveTab('reports')}>신고 목록</Button>
          <Button size="sm" variant={activeTab === 'blocks' ? 'default' : 'outline'} onClick={() => setActiveTab('blocks')}>차단 관리</Button>
        </div>
      </div>

      {activeTab === 'reports' ? (
        rows.length === 0 ? (
          <div className="border rounded-lg p-6 text-center text-muted-foreground">신고가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString('ko-KR')}</div>
                  <span className="text-xs px-2 py-1 rounded-full border">
                    {r.status}
                  </span>
                </div>
                <div className="mb-2 text-sm">대상: {r.target_type} · {r.target_id}</div>
                <div className="mb-1 text-xs text-muted-foreground">작성자 이메일: {
                  (() => {
                    const authorId = r.target_type === 'post' ? postAuthorIdByPostId[r.target_id] : commentAuthorIdByCommentId[r.target_id]
                    return authorId ? (authorEmailByUserId[authorId] || '불러오는 중...') : '불러오는 중...'
                  })()
                }</div>
                <div className="mb-3 text-xs text-muted-foreground">신고자 이메일: {reporterEmailMap[r.reporter_id] || '불러오는 중...'}</div>
                <div className="mb-3 whitespace-pre-wrap text-sm">사유: {r.reason || '(미입력)'}</div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={updating === r.id} onClick={() => rejectReport(r.id)}>반려</Button>
                  <Button size="sm" variant="destructive" disabled={updating === r.id} onClick={() => deleteTarget(r)}>삭제</Button>
                  {r.target_type === 'post' ? (
                    <Link href={`/posts/${r.target_id}`} className="text-sm underline ml-auto">게시글 보기</Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          {/* 이메일로 차단/차단 해제 */}
          <div className="border rounded-lg p-4 mb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 mb-3">
              <input
                type="email"
                value={blockEmail}
                onChange={(e) => setBlockEmail(e.target.value)}
                placeholder="차단할 사용자 이메일 입력"
                className="flex-1 border rounded px-3 py-2"
              />
              <Button size="sm" disabled={updating === 'block-email'} onClick={blockByEmail}>차단</Button>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
              <input
                type="email"
                value={unblockEmail}
                onChange={(e) => setUnblockEmail(e.target.value)}
                placeholder="차단 해제할 이메일 입력"
                className="flex-1 border rounded px-3 py-2"
              />
              <Button size="sm" variant="outline" disabled={updating === 'unblock-email'} onClick={unblockByEmail}>차단 해제</Button>
            </div>
          </div>
          {blockedUsers.length === 0 ? (
            <div className="border rounded-lg p-6 text-center text-muted-foreground">차단된 사용자가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((u: any) => (
                <div key={u.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="text-sm">{u.email}</div>
                  <Button size="sm" variant="outline" disabled={updating === u.id} onClick={() => unblockUser(u.id)}>차단 해제</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
