'use client'

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'

const categories = [
  { id: '전체', name: '전체' },
  { id: '자유', name: '자유' },
  { id: '질문', name: '질문' },
  { id: '정보', name: '정보' },
  { id: '고민', name: '고민' },
  { id: '공지', name: '공지' },
]

interface CategoryFilterProps {
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

export const CategoryFilter = memo(function CategoryFilter({ selectedCategory = '전체', onCategoryChange }: CategoryFilterProps) {
  const handleCategoryClick = useCallback((categoryId: string) => {
    onCategoryChange?.(categoryId)
  }, [onCategoryChange])

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryClick(category.id)}
          className="text-sm cursor-pointer"
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
})
