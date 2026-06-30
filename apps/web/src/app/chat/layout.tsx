'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/features/auth/auth-guard';

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
        {children}
      </div>
    </AuthGuard>
  );
}
