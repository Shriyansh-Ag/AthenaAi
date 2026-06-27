'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const forgotSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export function ForgotPasswordForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
  });

  const forgotMutation = useMutation({
    mutationFn: authApi.forgotPassword,
  });

  const onSubmit = (data: z.infer<typeof forgotSchema>) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        toast.success('If an account exists, a reset link has been sent to your email.');
      },
      onError: () => {
        toast.error('An error occurred. Please try again.');
      }
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a reset link.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" {...register('email')} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
            {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Remember your password?{' '}
            <a href="/login" className="text-primary hover:underline">
              Login
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
