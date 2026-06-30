import { QuizAttemptModel } from '../../models/quiz.model';
import { StudyPlanModel } from '../../models/study-plan.model';

export class AnalyticsService {
  async getDashboardData(userId: string) {
    // 1. Fetch all quiz attempts for the user
    const quizAttempts = await QuizAttemptModel.find({ userId }).sort({ completedAt: 1 }).lean();

    // 2. Fetch all study plans for the user
    const studyPlans = await StudyPlanModel.find({ userId }).lean();

    // --- Aggregating Quiz Metrics ---
    let totalQuizScore = 0;
    let totalMaxScore = 0;
    let totalQuizDurationMs = 0;
    
    // Time-series data for accuracy graph
    const accuracyTimeline: { date: string; scorePercentage: number }[] = [];

    quizAttempts.forEach(attempt => {
      totalQuizScore += attempt.totalScore;
      totalMaxScore += attempt.maxScore;
      totalQuizDurationMs += attempt.durationMs || 0;

      const dateStr = attempt.completedAt ? new Date(attempt.completedAt).toISOString().split('T')[0] : '';
      if (dateStr) {
        accuracyTimeline.push({
          date: dateStr,
          scorePercentage: attempt.maxScore > 0 ? (attempt.totalScore / attempt.maxScore) * 100 : 0
        });
      }
    });

    const averageQuizAccuracy = totalMaxScore > 0 ? (totalQuizScore / totalMaxScore) * 100 : 0;

    // --- Aggregating Study Time ---
    let totalStudyMinutes = 0;
    let completedTasksCount = 0;
    let totalTasksCount = 0;

    studyPlans.forEach(plan => {
      plan.dailyTasks.forEach((task: any) => {
        totalTasksCount++;
        if (task.status === 'completed') {
          completedTasksCount++;
          totalStudyMinutes += task.estimatedMinutes;
        }
      });
    });

    const totalStudyTimeMs = totalQuizDurationMs + (totalStudyMinutes * 60 * 1000);
    const overallMastery = ((averageQuizAccuracy * 0.6) + (totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 40 : 0));

    // --- Weak / Strong Topics Mock/Dynamic Calculation ---
    // In a full implementation, we would join the `QuizAttempt` answers with `Quiz` questions to see exactly which topic failed.
    // For simplicity, we'll derive it from the user's active study plan constraints and quiz scores.
    // If we have an active plan, their weak topics are literally listed there.
    const activePlan = studyPlans.length > 0 ? studyPlans[studyPlans.length - 1] : null;
    const weakTopics = activePlan?.weakTopics || ['No data'];
    
    // Let's just create some mock strong topics if none are explicitly tracked
    const strongTopics = ['Core Concepts', 'Fundamentals'];

    return {
      summary: {
        overallMastery: Math.round(overallMastery),
        averageQuizAccuracy: Math.round(averageQuizAccuracy),
        totalStudyTimeMs,
        completedTasksCount,
      },
      accuracyTimeline,
      topics: {
        weak: weakTopics,
        strong: strongTopics
      }
    };
  }
}
