'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, UserCheck, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function NicknamePage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [nickname, setNickname] = useState(user?.user_metadata?.nickname || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])
  if (!user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 유효성 검사
    if (!nickname.trim()) {
      setMessage('닉네임을 입력해주세요.')
      setLoading(false)
      return
    }

    if (nickname.trim().length < 2) {
      setMessage('닉네임은 최소 2자 이상이어야 합니다.')
      setLoading(false)
      return
    }

    if (nickname.trim().length > 20) {
      setMessage('닉네임은 최대 20자까지 가능합니다.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { nickname: nickname.trim() }
      })

      if (error) throw error

      setMessage('닉네임이 성공적으로 변경되었습니다.')
    } catch (error: any) {
      setMessage('닉네임 변경에 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">닉네임 설정</h1>
              <p className="text-muted-foreground">커뮤니티에서 사용할 닉네임을 설정하세요</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="text-center">
              <UserCheck className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <CardTitle>닉네임 설정</CardTitle>
              <CardDescription>
                다른 사용자들에게 표시될 닉네임을 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium mb-2">
                    닉네임
                  </label>
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="사용할 닉네임을 입력하세요"
                    maxLength={20}
                    required
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      2-20자 사이로 입력해주세요
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nickname.length}/20
                    </p>
                  </div>
                </div>

                {user.user_metadata?.nickname && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700">
                        현재 닉네임: {user.user_metadata.nickname}
                      </span>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('성공') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '변경 중...' : '닉네임 변경'}
                </Button>

                <div className="text-center">
                  <Button variant="outline" asChild>
                    <Link href="/settings">설정으로 돌아가기</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
