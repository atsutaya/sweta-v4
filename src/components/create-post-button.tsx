'use client'

import { useSupabase } from './supabase-provider'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import Link from 'next/link'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export function CreatePostButton() {
  const { user } = useSupabase()
  const [isHovered, setIsHovered] = useState(false)

  if (!user) {
    return (
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20">
        <CardContent className="p-4 sm:p-5">
          <Link href="/auth">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-500 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-foreground text-base sm:text-lg truncate">로그인하고 글쓰기</div>
                <div className="text-sm text-muted-foreground hidden sm:block truncate">자유롭게 의견을 나누세요</div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${
        isHovered ? 'border-primary/30 shadow-xl' : 'hover:border-primary/20'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 sm:p-5">
        <Link href="/posts/create">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 bg-blue-500 rounded-lg flex items-center justify-center transition-transform ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}>
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-foreground text-base sm:text-lg truncate">
                새 게시글 작성
              </div>
              <div className="text-sm text-muted-foreground hidden sm:block truncate">간단히 글을 올려보세요</div>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}
