'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(token ? 'verifying' : 'error');

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyEmail,
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    verifyMutation.mutate(token, {
      onSuccess: () => setStatus('success'),
      onError: () => setStatus('error'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Email Verification</CardTitle>
        <CardDescription>
          {status === 'verifying' && 'Verifying your email address...'}
          {status === 'success' && 'Email verified successfully!'}
          {status === 'error' && 'Failed to verify email.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        {status === 'verifying' && (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        )}
        {status === 'success' && (
          <div className="text-center space-y-4">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <Button onClick={() => router.push('/login')} className="w-full">
              Proceed to Login
            </Button>
          </div>
        )}
        {status === 'error' && (
          <div className="text-center space-y-4">
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <p className="text-sm text-muted-foreground">The verification link may be expired or invalid.</p>
            <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
              Return to Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
