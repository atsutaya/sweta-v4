'use client'

import { useSupabase } from './supabase-provider'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export function FloatingCreateButton() {
  const { user } = useSupabase()

  if (!user) {
    return (
      <Link href="/auth">
        <div className="fixed bottom-6 right-4 sm:hidden z-50">
          <div className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span className="font-medium">글쓰기</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href="/posts/create">
      <div className="fixed bottom-6 right-4 sm:hidden z-50">
        <div className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 active:scale-95">
          <Plus className="w-5 h-5" />
          <span className="font-medium">글쓰기</span>
        </div>
      </div>
    </Link>
  )
}
