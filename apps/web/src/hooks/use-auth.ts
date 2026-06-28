import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../lib/auth';
import { useAuthStore } from '../stores/auth-store';

export function useAuth() {
  const queryClient = useQueryClient();
  const { setAccessToken, setUser, logout: clearStore, isAuthenticated, user } = useAuthStore();

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      queryClient.setQueryData(['user'], data.data.user);
    },
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      queryClient.setQueryData(['user'], data.data.user);
    },
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearStore();
      queryClient.clear();
    },
  });

  const profileQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const data = await authApi.getProfile();
      setUser(data.data.user);
      return data.data.user;
    },
    enabled: isAuthenticated, // Only fetch if we believe we are authenticated
    retry: false, // Don't retry on 401
  });

  return {
    user,
    isAuthenticated,
    isProfileLoading: profileQuery.isLoading,
    login,
    register,
    logout,
  };
}
