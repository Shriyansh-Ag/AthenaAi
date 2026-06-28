import { apiClient } from './api-client';
import type { AuthResponse, User } from '../types/auth';

export const authApi = {
  login: async (data: Record<string, unknown>): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: Record<string, unknown>): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  forgotPassword: async (data: { email: string }): Promise<void> => {
    await apiClient.post('/auth/forgot-password', data);
  },

  resetPassword: async (data: Record<string, unknown>): Promise<void> => {
    await apiClient.post('/auth/reset-password', data);
  },

  verifyEmail: async (token: string): Promise<{ success: boolean; data: { user: User } }> => {
    const res = await apiClient.get(`/auth/verify-email/${token}`);
    return res.data;
  },

  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};
