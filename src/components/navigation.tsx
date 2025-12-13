'use client'

import { useSupabase } from './supabase-provider'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navigation() {
  const { user, supabase } = useSupabase()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        if (!user) { setIsAdmin(false); return }
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        setIsAdmin((data as any)?.role === 'admin')
      } catch {
        setIsAdmin(false)
      }
    })()
  }, [user?.id])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      setShowProfileMenu(false)
    }
  }

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 via-green-500 to-orange-500">
              <span className="text-white text-lg font-bold">ㅅ</span>
            </div>
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              사우고 에타
            </span>
          </Link>


          {/* 모바일 메뉴 버튼 제거 (프로필로만 진입) */}
          <div className="md:hidden" />

          {/* 사용자 메뉴 */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 hover:bg-accent"
                >
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user.user_metadata?.nickname || user.email?.split('@')[0] || '사용자'}
                  </span>
                </Button>

                {/* 프로필 드롭다운 메뉴 */}
                {showProfileMenu && (
                  <Card className="absolute right-0 top-full mt-2 w-48 shadow-lg border-2">
                    <CardContent className="p-2">
                      <div className="space-y-1">
                        {isAdmin && (
                          <Link href="/admin/reports">
                            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                              <span className="text-sm text-primary">관리자 페이지</span>
                            </div>
                          </Link>
                        )}
                        <Link href="/settings">
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <span className="text-sm">설정</span>
                          </div>
                        </Link>
                        <Link href="/my-activity">
                          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                            <span className="text-sm">내 활동</span>
                          </div>
                        </Link>
                        <div className="border-t border-border my-1"></div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer text-left"
                        >
                          <span className="text-sm text-red-600">로그아웃</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth">
                    로그인
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth?mode=signup">
                    회원가입
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* 모바일 사용자 메뉴 */}
          <div className="md:hidden">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth">
                  로그인
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 제거. 프로필 드롭다운만 사용 */}

      {/* 모바일 프로필 메뉴 오버레이 */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setShowProfileMenu(false)}
        />
      )}

      {/* 모바일 프로필 드롭다운 전체폭 패널 */}
      {showProfileMenu && (
        <div className="md:hidden fixed top-16 left-0 right-0 w-full bg-background border-t border-border shadow-lg z-50">
          <div className="px-4 py-4 space-y-2">
            {user ? (
              <>
                    {isAdmin && (
                      <Link href="/admin/reports" onClick={() => setShowProfileMenu(false)}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                          <span className="text-sm text-primary">관리자 페이지</span>
                        </div>
                      </Link>
                    )}
                <Link href="/settings" onClick={() => setShowProfileMenu(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <span className="text-sm">설정</span>
                  </div>
                </Link>
                <Link href="/my-activity" onClick={() => setShowProfileMenu(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <span className="text-sm">내 활동</span>
                  </div>
                </Link>
                <div className="border-t border-border my-2"></div>
                <button
                  onClick={() => {
                    handleSignOut()
                    setShowProfileMenu(false)
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <span className="text-sm text-red-600">로그아웃</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setShowProfileMenu(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <span className="text-sm">로그인</span>
                  </div>
                </Link>
                <Link href="/auth?mode=signup" onClick={() => setShowProfileMenu(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                    <span className="text-sm">회원가입</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
