'use client';

import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

export default function UserProfile() {
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();
  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });

  if (!user) return null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Name</h3>
          <p className="text-lg">{user.name}</p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Email</h3>
          <p className="text-lg flex items-center gap-2">
            {user.email}
            {user.isVerified ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Unverified</span>
            )}
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Role</h3>
          <p className="text-lg capitalize">{user.role}</p>
        </div>
        <div className="pt-4 border-t">
          <Button 
            variant="destructive" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
}
