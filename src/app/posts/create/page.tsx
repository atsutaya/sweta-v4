import { CreatePostForm } from '@/components/create-post-form'

export default function CreatePostPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            새 글 작성
          </h1>
          <p className="text-muted-foreground">
            자유롭게 의견을 작성해주세요
          </p>
        </div>

        <div className="max-w-2xl">
          <CreatePostForm />
        </div>
      </div>
    </div>
  )
}
