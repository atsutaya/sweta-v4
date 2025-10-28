'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Palette, Upload, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ProfileImagePage() {
  const { user } = useSupabase()
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/auth')
    }
  }, [user, router])
  if (!user) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 검사 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('파일 크기는 5MB 이하여야 합니다.')
        return
      }
      
      // 파일 타입 검사
      if (!file.type.startsWith('image/')) {
        setMessage('이미지 파일만 업로드 가능합니다.')
        return
      }

      setSelectedFile(file)
      setMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setMessage('이미지를 선택해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 임시 구현 - 실제로는 Supabase Storage에 업로드
      await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
      
      setMessage('데이터 베이스 용량 문제로 임시 구현 상태입니다.')
      setSelectedFile(null)
    } catch (error: any) {
      setMessage('이미지 업로드에 실패했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">프로필 이미지 변경</h1>
              <p className="text-muted-foreground">커뮤니티에서 표시될 이미지를 설정하세요</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="text-center">
              <Palette className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <CardTitle>프로필 이미지 변경</CardTitle>
              <CardDescription>
                현재 프로필 이미지를 새로운 이미지로 변경합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 현재 프로필 이미지 */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-primary-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    현재 프로필 이미지
                  </p>
                </div>

                {/* 파일 업로드 */}
                <div>
                  <label htmlFor="profileImage" className="block text-sm font-medium mb-2">
                    새 프로필 이미지
                  </label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="profileImage" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : '이미지를 선택하거나 드래그하세요'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF (최대 5MB)
                      </p>
                    </label>
                  </div>
                </div>

                {/* 선택된 파일 미리보기 */}
                {selectedFile && (
                  <div className="text-center">
                    <p className="text-sm font-medium mb-2">선택된 이미지:</p>
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="미리보기"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                    </p>
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('성공') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading || !selectedFile}
                  className="w-full"
                >
                  {loading ? '업로드 중...' : '이미지 변경'}
                </Button>

                <div className="text-center">
                  <Button variant="outline" asChild>
                    <Link href="/settings">설정으로 돌아가기</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
