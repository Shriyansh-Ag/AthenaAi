import { apiClient } from './api-client';

export const analyticsApi = {
  getDashboardData: async () => {
    const res = await apiClient.get('/analytics/dashboard');
    return res.data;
  }
};
