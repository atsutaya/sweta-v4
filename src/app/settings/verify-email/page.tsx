'use client'

import { useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VerifyEmailPage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  if (!user) {
    router.push('/auth')
    return null
  }

  // email_verified는 Supabase User 타입에 없으므로 false로 처리
  const emailVerified = false

  const handleResendEmail = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
      })

      if (error) throw error
      setMessage('인증 이메일이 다시 전송되었습니다. 이메일을 확인해주세요.')
    } catch (error: any) {
      setMessage('이메일 전송에 실패했습니다: ' + error.message)
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
              <h1 className="text-2xl font-bold">이메일 인증</h1>
              <p className="text-muted-foreground">이메일 인증을 완료하세요</p>
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
              {emailVerified ? (
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              )}
              <CardTitle>
                {emailVerified ? '인증 완료' : '이메일 인증 필요'}
              </CardTitle>
              <CardDescription>
                {emailVerified 
                  ? '이메일 인증이 완료되었습니다.' 
                  : '계정 보안을 위해 이메일 인증을 완료해주세요.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  현재 이메일:
                </p>
                <p className="font-medium">{user.email}</p>
              </div>

              {!emailVerified && (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800 mb-1">
                          인증 이메일을 확인하세요
                        </p>
                        <p className="text-yellow-700">
                          {user.email}로 전송된 인증 이메일을 확인하고 링크를 클릭하세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleResendEmail} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? '전송 중...' : '인증 이메일 다시 보내기'}
                  </Button>
                </>
              )}

              {message && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.includes('실패') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="text-center">
                <Button variant="outline" asChild>
                  <Link href="/settings">설정으로 돌아가기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
