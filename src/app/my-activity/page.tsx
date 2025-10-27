import { Suspense } from 'react'
import { MyActivity } from '@/components/my-activity'
import { MyActivitySkeleton } from '@/components/my-activity-skeleton'

export default function MyActivityPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            내 활동
          </h1>
          <p className="text-muted-foreground">
            내가 작성한 글과 댓글을 확인할 수 있습니다
          </p>
        </div>

        <Suspense fallback={<MyActivitySkeleton />}>
          <MyActivity />
        </Suspense>
      </div>
    </div>
  )
}
