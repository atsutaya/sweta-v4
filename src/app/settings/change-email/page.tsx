'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ChangeEmailPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!user) {
    router.push('/auth')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 유효성 검사
    if (!newEmail.includes('@')) {
      setMessage('올바른 이메일 주소를 입력해주세요.')
      setLoading(false)
      return
    }

    if (newEmail === user.email) {
      setMessage('현재 이메일과 동일한 주소입니다.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) throw error

      setMessage('이메일 변경 요청이 전송되었습니다. 새 이메일을 확인하여 인증을 완료해주세요.')
      setNewEmail('')
      setPassword('')
    } catch (error: any) {
      setMessage('이메일 변경에 실패했습니다: ' + error.message)
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
              <h1 className="text-2xl font-bold">이메일 변경</h1>
              <p className="text-muted-foreground">새로운 이메일 주소로 변경하세요</p>
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
              <Mail className="w-12 h-12 text-purple-500 mx-auto mb-4" />
              <CardTitle>이메일 변경</CardTitle>
              <CardDescription>
                새로운 이메일 주소로 계정을 업데이트합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 mb-1">
                      현재 이메일
                    </p>
                    <p className="text-blue-700">{user.email}</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newEmail" className="block text-sm font-medium mb-2">
                    새 이메일 주소
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="새 이메일 주소를 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="현재 비밀번호를 입력하세요"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    보안을 위해 현재 비밀번호를 확인합니다
                  </p>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('요청') 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : message.includes('실패') 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    {message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? '변경 중...' : '이메일 변경'}
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
