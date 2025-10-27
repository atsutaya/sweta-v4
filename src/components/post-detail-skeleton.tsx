export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="w-24 h-10 bg-gray-200 rounded mb-4"></div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-5 bg-gray-200 rounded"></div>
              <div className="w-16 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>

          <div className="w-3/4 h-8 bg-gray-200 rounded mb-4"></div>
          
          <div className="space-y-3 mb-6">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
              <div className="w-8 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
          </div>

          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="w-16 h-6 bg-gray-200 rounded mb-4"></div>
        
        <div className="space-y-3 mb-6">
          <div className="w-full h-20 bg-gray-200 rounded"></div>
          <div className="flex gap-2">
            <div className="w-20 h-8 bg-gray-200 rounded"></div>
            <div className="w-16 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-16 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="w-full h-4 bg-gray-200 rounded"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
                <div className="w-12 h-6 bg-gray-200 rounded"></div>
                <div className="w-12 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
