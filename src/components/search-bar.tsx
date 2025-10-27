'use client'

import { useState, memo, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Button } from './ui/button'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export const SearchBar = memo(function SearchBar({ onSearch, placeholder = "검색어를 입력하세요..." }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }, [onSearch, query])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <Button type="submit" size="sm">
        검색
      </Button>
    </form>
  )
})
