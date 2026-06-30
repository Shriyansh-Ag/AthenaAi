import { Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-0.5">
                  Knowledge base overview and processing health
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/documents" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Manage Documents
              </Link>
              <Link href="/search" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Semantic Search
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md"></div>
          <div className="h-4 w-72 bg-muted animate-pulse rounded-md"></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-xl bg-card shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-muted animate-pulse rounded-md"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded-full"></div>
            </div>
            <div className="h-8 w-16 bg-muted animate-pulse rounded-md"></div>
            <div className="h-3 w-32 bg-muted animate-pulse rounded-md"></div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-6 border rounded-xl bg-card shadow-sm h-[400px]">
          <div className="h-6 w-32 bg-muted animate-pulse rounded-md mb-6"></div>
          <div className="h-[300px] w-full bg-muted animate-pulse rounded-md"></div>
        </div>
        
        <div className="col-span-3 p-6 border rounded-xl bg-card shadow-sm h-[400px]">
          <div className="h-6 w-40 bg-muted animate-pulse rounded-md mb-6"></div>
          <div className="h-4 w-full bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md"></div>
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
