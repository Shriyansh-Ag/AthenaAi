'use client';

import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/lib/documents';
import { formatFileSize, getFileTypeConfig, formatDate } from '@/types/document';
import { 
  FileText, 
  HardDrive, 
  CheckCircle2, 
  XCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => documentsApi.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    // This handles client-side loading, Server-side uses loading.tsx
    return null;
  }

  if (error || !data?.success) {
    return (
      <div className="flex-1 p-8">
        <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-xl">
          Failed to load dashboard statistics. Please try again later.
        </div>
      </div>
    );
  }

  const stats = data.data;

  // Colors for Recharts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
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
              <Link href="/quizzes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                AI Quizzes
              </Link>
              <Link href="/planner" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Study Planner
              </Link>
              <Link href="/analytics" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Documents */}
        <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Documents</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.overview.totalDocuments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Documents currently in knowledge base
          </p>
        </div>

        {/* Total Storage */}
        <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Storage Used</h3>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatFileSize(stats.overview.totalStorageUsed)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total space consumed
          </p>
        </div>

        {/* Successfully Processed */}
        <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Processed</h3>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{stats.overview.processedCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ready for semantic search
          </p>
        </div>

        {/* Processing/Failed */}
        <div className="p-6 border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Attention Required</h3>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{stats.overview.failedCount + stats.overview.processingCount}</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span className="text-amber-500">{stats.overview.processingCount} processing</span>
            <span className="text-destructive">{stats.overview.failedCount} failed</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Storage Over Time Chart */}
        <div className="col-span-4 p-6 border rounded-xl bg-card shadow-sm flex flex-col">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Upload Activity (Last 30 Days)
          </h3>
          <div className="flex-1 min-h-[300px]">
            {stats.storageOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.storageOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="_id" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatFileSize(val)}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatFileSize(value), 'Storage']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
                  />
                  <Area type="monotone" dataKey="size" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSize)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                No activity data available.
              </div>
            )}
          </div>
        </div>
        
        {/* Document Types Chart & Errors */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="p-6 border rounded-xl bg-card shadow-sm flex-1">
            <h3 className="font-semibold mb-4">Storage by File Type</h3>
            <div className="h-[200px]">
              {stats.byType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="storage"
                    >
                      {stats.byType.map((entry, index) => {
                        const config = getFileTypeConfig(entry._id);
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatFileSize(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => {
                        const config = getFileTypeConfig(entry.payload._id);
                        return <span className="text-sm font-medium">{config.label}</span>;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                  No documents found.
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border rounded-xl bg-card shadow-sm flex-1">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              Recent Issues
              <Link href="/documents?status=failed" className="text-xs font-medium text-primary hover:underline">
                View All
              </Link>
            </h3>
            <div className="space-y-3">
              {stats.recentErrors.length > 0 ? (
                stats.recentErrors.map((error) => (
                  <div key={error._id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{error.displayName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(error.uploadedAt)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 text-green-500/50 mb-2" />
                  <p className="text-sm">No recent processing errors</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
