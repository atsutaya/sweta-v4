'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { PostCard } from './post-card'
import { SearchBar } from './search-bar'
import { CategoryFilter } from './category-filter'
import { samplePosts } from '@/lib/sample-data'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

// 가상화를 위한 청크 크기
const CHUNK_SIZE = 10

export function PostList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // 서버와 클라이언트 초기 렌더 출력 일치 보장을 위해 초기값은 항상 샘플 데이터로 고정
  const [posts, setPosts] = useState<any[]>(samplePosts)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  
  const fetchPage = useCallback(async (pageIndex: number, append: boolean) => {
    // Supabase에서 페이지 단위로 로드, 실패 시 폴백
    const from = pageIndex * CHUNK_SIZE
    const to = from + CHUNK_SIZE - 1
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (selectedCategory !== '전체') {
        query = query.eq('category', selectedCategory)
      }
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`
        query = query.or(`title.ilike.${q},content.ilike.${q}`)
      }

      const { data, error } = await query
      if (error) throw error

      const newPosts = data || []

      // 서버가 비어있을 때 첫 페이지는 로컬+샘플 폴백으로 유지하여 목록이 사라지지 않도록 함
      if (pageIndex === 0 && newPosts.length === 0) {
        const localPosts = JSON.parse(localStorage.getItem('samplePosts') || '[]')
        const merged = [...localPosts, ...samplePosts]
        const filtered = merged.filter((post) => {
          if (post.is_blinded) return false
          if (selectedCategory !== '전체' && post.category !== selectedCategory) return false
          if (!searchQuery) return true
          return (
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        })
        const slice = filtered.slice(from, to + 1)
        setPosts(slice)
        setHasMore(slice.length === CHUNK_SIZE)
        return
      }

      setPosts(prev => (append ? [...prev, ...newPosts] : newPosts))
      if (append) {
        setVisibleCount(prev => prev + newPosts.length)
      } else {
        setVisibleCount(Math.max(CHUNK_SIZE, newPosts.length))
      }
      setHasMore(newPosts.length === CHUNK_SIZE)
    } catch (e) {
      // 폴백: 로컬 스토리지 + 샘플 데이터에서 클라이언트 필터
      const localPosts = JSON.parse(localStorage.getItem('samplePosts') || '[]')
      const merged = [...localPosts, ...samplePosts]
      const filtered = merged.filter((post) => {
        if (post.is_blinded) return false
        if (selectedCategory !== '전체' && post.category !== selectedCategory) return false
        if (!searchQuery) return true
        return (
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      const slice = filtered.slice(from, to + 1)
      setPosts(prev => (append ? [...prev, ...slice] : slice))
      if (append) {
        setVisibleCount(prev => prev + slice.length)
      } else {
        setVisibleCount(Math.max(CHUNK_SIZE, slice.length))
      }
      setHasMore(slice.length === CHUNK_SIZE)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory])

  // 클라이언트 마운트 후에만 로컬 스토리지 병합(하이드레이션 불일치 방지)
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem('samplePosts') || '[]')
      if (Array.isArray(local) && local.length > 0) {
        // 중복 제거(최근 로컬 우선)
        const map = new Map<string, any>()
        for (const p of [...local, ...samplePosts]) {
          map.set(p.id, p)
        }
        setPosts(Array.from(map.values()))
      }
    } catch {}
  }, [])

  // 초기 로드
  useEffect(() => {
    setPage(0)
    fetchPage(0, false)
  }, [fetchPage])

  // 스크랩 변경 이벤트 수신 시 첫 페이지 재조회
  useEffect(() => {
    const handler = () => {
      setPage(0)
      fetchPage(0, false)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('scrap-updated', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scrap-updated', handler as EventListener)
      }
    }
  }, [fetchPage])

  // 댓글 생성 이벤트 수신 시 첫 페이지 재조회(카드의 comments_count 최신화)
  useEffect(() => {
    const handler = () => {
      setPage(0)
      fetchPage(0, false)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('comment-created', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('comment-created', handler as EventListener)
      }
    }
  }, [fetchPage])

  // 새 게시글 생성 이벤트 수신 시 첫 페이지 재조회
  useEffect(() => {
    const handler = () => {
      setPage(0)
      fetchPage(0, false)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('post-created', handler as EventListener)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('post-created', handler as EventListener)
      }
    }
  }, [fetchPage])

  // 필터링 로직을 useMemo로 최적화
  const filteredPosts = useMemo(() => {
    // 서버 필터를 적용했더라도, 폴백 경로에서는 클라이언트 필터가 필요하므로 동일 로직 유지
    return posts.filter(post => {
      if (post.is_blinded) return false
      if (selectedCategory !== '전체' && post.category !== selectedCategory) return false
      if (!searchQuery) return true
      return (
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [posts, searchQuery, selectedCategory])

  // 보여줄 게시글만 선택 (가상화)
  const visiblePosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount)
  }, [filteredPosts, visibleCount])

  // 무한 스크롤 설정
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPage(nextPage, true)
        }
      },
      { threshold: 0.1 }
    )

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [page, hasMore, loading, fetchPage])

  // 검색이나 카테고리 변경 시 visibleCount 리셋
  useEffect(() => {
    // 필터 변경 시 서버 첫 페이지로 리셋
    setPage(0)
    fetchPage(0, false)
  }, [searchQuery, selectedCategory, fetchPage])

  // 콜백 함수들을 useCallback으로 최적화
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
          <div className="flex-1">
            <div className="relative">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="relative">
              <CategoryFilter 
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-muted-foreground">
            {searchQuery || selectedCategory !== '전체' ? (
              <div>
                
                <div className="text-lg font-medium mb-2">검색 결과가 없습니다</div>
                <div className="text-sm">다른 키워드나 카테고리로 검색해보세요</div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-medium mb-2">게시글이 없습니다</div>
                <div className="text-sm">첫 번째 게시글을 작성해보세요</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {/* 무한 스크롤 로딩 인디케이터 */}
          {(hasMore || loading) && (
            <div 
              ref={loadingRef}
              className="text-center py-6"
            >
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground">
                    <div className="animate-pulse">더 많은 게시글 로딩 중...</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
