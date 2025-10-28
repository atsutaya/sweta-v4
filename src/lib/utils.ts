import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 메모이제이션을 위한 캐시
const dateCache = new Map<string, string>()
const anonymousNameCache = new Map<string, string>()

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const dateStr = typeof date === 'string' ? date : date.toISOString()
  
  // 캐시 확인
  if (dateCache.has(dateStr)) {
    return dateCache.get(dateStr)!
  }
  
  const d = new Date(date)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))
  
  let result: string
  
  if (diffInHours < 1) {
    result = '방금 전'
  } else if (diffInHours < 24) {
    result = `${diffInHours}시간 전`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      result = `${diffInDays}일 전`
    } else {
      result = d.toLocaleDateString('ko-KR')
    }
  }
  
  // 캐시에 저장 (최대 100개 항목 유지)
  if (dateCache.size > 100) {
    const firstKey = dateCache.keys().next().value as string | undefined
    if (firstKey !== undefined) {
      dateCache.delete(firstKey)
    }
  }
  dateCache.set(dateStr, result)
  
  return result
}

export function generateAnonymousName(userId: string, postId: string) {
  const key = `${userId}-${postId}`
  
  // 캐시 확인
  if (anonymousNameCache.has(key)) {
    return anonymousNameCache.get(key)!
  }
  
  // 더 효율적인 해시 함수
  let hash = 0
  const str = key
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff
  }
  
  const result = `익명${(Math.abs(hash) % 1000) + 1}`
  
  // 캐시에 저장
  anonymousNameCache.set(key, result)
  
  return result
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// 캐시 정리 함수 (메모리 관리)
export function clearCaches() {
  dateCache.clear()
  anonymousNameCache.clear()
}

