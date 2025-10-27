'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { useSupabase } from './supabase-provider'
import { toast } from '@/hooks/use-toast'

type ReportModalProps = {
  open: boolean
  onClose: () => void
  targetType: 'post' | 'comment'
  targetId: string
}

export function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const { user, supabase } = useSupabase()
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: '로그인이 필요합니다', description: '신고는 로그인 후 이용할 수 있어요.' })
      return
    }
    if (!reason.trim()) {
      toast({ title: '신고 사유를 입력해주세요' })
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        status: 'pending',
      })
      if (error) throw error
      toast({ title: '신고 접수', description: '신고가 접수되었습니다.' })
      onClose()
      setReason('')
    } catch (e) {
      toast({ title: '오류', description: '신고 처리 중 오류가 발생했습니다.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-5">
        <h3 className="text-lg font-semibold mb-3">신고하기</h3>
        <p className="text-sm text-muted-foreground mb-1">
          {targetType === 'post'
            ? '교칙이나 커뮤니티 이용 수칙에 위배되는 게시글을 신고합니다.'
            : '교칙에 위배되는 부적절한 댓글을 신고합니다.'}
        </p>
        <p className="text-sm font-semibold text-destructive mb-3">허위로 신고할 경우 서비스 이용이 제한될 수 있으니 유의해 주세요.</p>
        <textarea
          className="w-full border rounded-md p-2 text-sm mb-4 min-h-[96px]"
          placeholder="신고 사유를 입력해주세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>취소</Button>
          <Button onClick={handleSubmit} disabled={submitting}>{submitting ? '제출 중...' : '신고 제출'}</Button>
        </div>
      </div>
    </div>
  )
}


