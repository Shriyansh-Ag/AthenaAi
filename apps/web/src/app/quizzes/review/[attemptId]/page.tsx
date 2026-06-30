'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizzesApi } from '@/lib/quiz';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ArrowLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function QuizReviewPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;
  const router = useRouter();

  const [attemptData, setAttemptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, [attemptId]);

  const loadReview = async () => {
    try {
      const res = await quizzesApi.getAttemptReview(attemptId);
      setAttemptData(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to load review');
      router.push('/quizzes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Review...</div>;
  if (!attemptData) return null;

  const { attempt, quiz } = attemptData;
  const scorePercentage = (attempt.totalScore / attempt.maxScore) * 100;

  return (
    <div className="container max-w-4xl mx-auto py-10 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Quiz Results</h1>
          <p className="text-muted-foreground">{quiz.title}</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="text-6xl font-black text-primary mb-4">
            {scorePercentage.toFixed(0)}%
          </div>
          <p className="text-xl">
            You scored {attempt.totalScore} out of {attempt.maxScore} points
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Completed in {Math.round(attempt.durationMs / 1000)} seconds
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold mt-10">Detailed Review</h2>
        {quiz.questions.map((question: any, idx: number) => {
          const userAnswer = attempt.answers.find((a: any) => a.questionId === question._id);
          const isCorrect = userAnswer?.isCorrect;

          return (
            <Card key={question._id} className={isCorrect ? 'border-green-500/50' : 'border-destructive/50'}>
              <CardHeader className="flex flex-row gap-4 items-start pb-2">
                <div className="mt-1">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg leading-relaxed">{idx + 1}. {question.questionText}</CardTitle>
                  <CardDescription className="capitalize">{question.type.replace('_', ' ')} • {question.bloomLevel}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pl-14">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Your Answer</p>
                    <p className="font-medium">{userAnswer?.answer || 'No answer provided'}</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p className="text-xs text-primary font-semibold uppercase mb-1">Correct Answer</p>
                    <p className="font-medium">{question.correctAnswer}</p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-semibold">
                    <Lightbulb className="w-4 h-4" />
                    Explanation
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <ReactMarkdown>{question.explanation}</ReactMarkdown>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
