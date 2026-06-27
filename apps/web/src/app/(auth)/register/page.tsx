import { RegisterForm } from '@/components/features/auth/register-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - AthenaAI',
  description: 'Create a new AthenaAI account',
};

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">AthenaAI</h1>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
