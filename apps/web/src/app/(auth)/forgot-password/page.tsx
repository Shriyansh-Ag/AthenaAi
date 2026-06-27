import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password - AthenaAI',
  description: 'Reset your AthenaAI password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <ForgotPasswordForm />
    </div>
  );
}
