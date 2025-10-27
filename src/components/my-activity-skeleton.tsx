export function MyActivitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="w-24 h-10 bg-gray-200 rounded"></div>
        <div className="w-24 h-10 bg-gray-200 rounded"></div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-5 bg-gray-200 rounded"></div>
                <div className="w-16 h-5 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>

            <div className="w-3/4 h-6 bg-gray-200 rounded mb-2"></div>
            <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded mb-3"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
                <div className="w-8 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
