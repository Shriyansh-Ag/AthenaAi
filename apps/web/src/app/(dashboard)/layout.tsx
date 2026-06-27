'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/features/auth/auth-guard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        {children}
      </div>
    </AuthGuard>
  );
}
