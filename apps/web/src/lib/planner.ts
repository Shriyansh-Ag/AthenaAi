import { apiClient } from './api-client';

export const plannerApi = {
  generatePlan: async (data: { examDate: string; availableHoursPerWeek: number; weakTopics: string[]; courseMaterialId?: string }) => {
    const res = await apiClient.post('/planner/generate', data);
    return res.data;
  },
  getActivePlan: async () => {
    const res = await apiClient.get('/planner');
    return res.data;
  },
  updateTaskStatus: async (planId: string, taskId: string, status: 'pending' | 'completed' | 'missed') => {
    const res = await apiClient.patch(`/planner/${planId}/tasks/${taskId}`, { status });
    return res.data;
  }
};
