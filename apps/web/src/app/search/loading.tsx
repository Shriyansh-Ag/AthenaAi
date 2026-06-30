export default function SearchLoading() {
  return (
    <div className="container py-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>
      
      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0 space-y-6 hidden md:block">
          <div className="space-y-3">
            <div className="h-5 w-24 bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          </div>
          <div className="space-y-3">
            <div className="h-5 w-24 bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
          
          <div className="space-y-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border rounded-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div className="h-5 w-48 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-5 w-16 bg-muted animate-pulse rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-5/6 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-4 w-4/6 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-muted animate-pulse rounded-full"></div>
                  <div className="h-6 w-24 bg-muted animate-pulse rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
