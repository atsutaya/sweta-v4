'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { SupabaseProvider } from './supabase-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000, // 10분으로 증가 (더 적은 리페치)
            gcTime: 15 * 60 * 1000, // 15분 (메모리에서 더 오래 유지)
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 리페치 비활성화
            refetchOnReconnect: false, // 재연결 시 자동 리페치 비활성화
            retry: 1, // 재시도 횟수 제한
            retryDelay: 1000, // 재시도 지연 시간
          },
          mutations: {
            retry: 1, // 뮤테이션 재시도 횟수 제한
            retryDelay: 1000, // 재시도 지연 시간
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
