'use client'

export const dynamic = 'force-dynamic'

import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, User, Shield, Mail, Key, Palette, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { user } = useSupabase()
  const router = useRouter()

  // SSR/프리렌더 안전 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])
  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">설정</h1>
              <p className="text-muted-foreground">계정 및 커뮤니티 설정을 관리하세요</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>

          {/* 계정 설정 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                계정
              </CardTitle>
              <CardDescription>
                보안 및 계정 정보를 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/settings/verify-email" className="block">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium">이메일 인증</div>
                      <div className="text-sm text-muted-foreground">
                        이메일 인증 설정
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    !
                  </div>
                </div>
              </Link>

              <Link href="/settings/change-password" className="block">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium">비밀번호 변경</div>
                      <div className="text-sm text-muted-foreground">
                        계정 보안을 위해 주기적으로 변경하세요
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/settings/change-email" className="block">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-medium">이메일 변경</div>
                      <div className="text-sm text-muted-foreground">
                        현재: {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* 커뮤니티 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                커뮤니티
              </CardTitle>
              <CardDescription>
                프로필 및 커뮤니티 관련 설정을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/settings/nickname" className="block">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-medium">닉네임 설정</div>
                      <div className="text-sm text-muted-foreground">
                        현재: {user.user_metadata?.nickname || '설정되지 않음'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/settings/profile-image" className="block">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-pink-500" />
                    <div>
                      <div className="font-medium">프로필 이미지 변경</div>
                      <div className="text-sm text-muted-foreground">
                        커뮤니티에서 표시될 이미지를 설정하세요
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
