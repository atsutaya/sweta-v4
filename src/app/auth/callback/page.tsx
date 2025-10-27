'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/supabase-provider'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { supabase } = useSupabase()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=auth_failed')
          return
        }
        
        if (data.session) {
          router.push('/')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth?error=auth_failed')
      }
    }

    handleAuthCallback()
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  )
}
