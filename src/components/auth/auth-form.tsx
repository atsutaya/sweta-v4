'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import { ALLOWED_SCHOOL_DOMAINS, validateSchoolEmail, getAllowedDomainsString } from '@/config/school-domains'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // URL 파라미터 확인하여 회원가입 모드 설정
  useEffect(() => {
    const mode = searchParams.get('mode')
    if (mode === 'signup') {
      setIsLogin(false)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // 로그인 시에도 학교 이메일 검증
        if (!validateSchoolEmail(email)) {
          throw new Error(`학교 이메일만 로그인 가능합니다. 허용된 도메인: ${getAllowedDomainsString()}`)
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      } else {
        // 회원가입 시 유효성 검사
        if (!validateSchoolEmail(email)) {
          throw new Error(`학교 이메일만 가입 가능합니다. 허용된 도메인: ${getAllowedDomainsString()}`)
        }
        if (password !== confirmPassword) {
          throw new Error('비밀번호가 일치하지 않습니다.')
        }
        if (password.length < 6) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
        }
        if (!nickname.trim()) {
          throw new Error('닉네임을 입력해주세요.')
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim()
            }
          }
        })
        if (error) throw error
        toast({ title: '확인 메일 발송', description: '가입 확인 이메일을 확인해주세요.' })
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`
        }
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setNickname('')
    setError('')
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {isLogin ? '로그인' : '회원가입'}
        </h2>
        <p className="text-muted-foreground">
          {isLogin ? '계정에 로그인하세요' : '새 계정을 만드세요'}
        </p>
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            현재 학교 계정만 이용 가능합니다
          </p>
          <p className="text-xs text-red-600 mt-1">
            허용된 도메인: {getAllowedDomainsString()}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
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
              required={!isLogin}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="이메일을 입력하세요"
            required
          />
          {!isLogin && (
            <p className="text-xs text-muted-foreground mt-1">
              학교 이메일만 가입 가능합니다. ({getAllowedDomainsString()})
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={isLogin ? "비밀번호를 입력하세요" : "최소 6자 이상"}
            required
          />
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="비밀번호를 다시 입력하세요"
              required={!isLogin}
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? '처리중...' : (isLogin ? '로그인' : '회원가입')}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              또는
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            onClick={() => handleOAuth('google')}
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 {isLogin ? '로그인' : '회원가입'}
          </Button>
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            resetForm()
          }}
          className="text-sm text-primary hover:underline"
        >
          {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>
    </div>
  )
}
