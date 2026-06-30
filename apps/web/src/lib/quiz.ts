import { apiClient } from './api-client';

export const quizzesApi = {
  getQuizzes: async () => {
    const res = await apiClient.get('/quizzes');
    return res.data;
  },
  getQuizById: async (id: string) => {
    const res = await apiClient.get(`/quizzes/${id}`);
    return res.data;
  },
  generateQuiz: async (data: { topicOrDocumentId: string; count?: number; difficulty?: string }) => {
    const res = await apiClient.post('/quizzes/generate', data);
    return res.data;
  },
  deleteQuiz: async (id: string) => {
    const res = await apiClient.delete(`/quizzes/${id}`);
    return res.data;
  },
  submitAttempt: async (quizId: string, data: { answers: { questionId: string; answer: string }[]; durationMs: number }) => {
    const res = await apiClient.post(`/quizzes/${quizId}/submit`, data);
    return res.data;
  },
  getAttemptReview: async (attemptId: string) => {
    const res = await apiClient.get(`/quizzes/attempts/${attemptId}`);
    return res.data;
  }
};
