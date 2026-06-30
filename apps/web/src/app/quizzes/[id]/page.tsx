'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { quizzesApi } from '@/lib/quiz';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Clock, ArrowRight, ArrowLeft } from 'lucide-react';

export default function QuizTakerPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz) {
      const timer = setInterval(() => {
        setTimeLeft(t => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quiz]);

  const loadQuiz = async () => {
    try {
      const res = await quizzesApi.getQuizById(quizId);
      setQuiz(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to load quiz');
      router.push('/quizzes');
    }
  };

  const handleNext = () => {
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setShowHint(false);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setShowHint(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(answers).map(qId => ({
        questionId: qId,
        answer: answers[qId]
      }));
      
      const attempt = await quizzesApi.submitAttempt(quizId, {
        answers: formattedAnswers,
        durationMs: timeLeft * 1000
      });
      
      router.push(`/quizzes/review/${attempt.data._id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!quiz) return <div className="p-10 text-center">Loading Quiz...</div>;

  const question = quiz.questions[currentIdx];
  const progress = ((currentIdx + 1) / quiz.questions.length) * 100;

  return (
    <div className="container max-w-3xl mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">Question {currentIdx + 1} of {quiz.questions.length}</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-full font-mono">
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <Card className="mt-8 border-2 shadow-sm relative overflow-hidden">
        {/* Bloom Taxonomy Label */}
        <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 text-xs font-semibold rounded-bl-lg capitalize border-b border-l border-primary/20">
          {question.bloomLevel}
        </div>
        
        <CardHeader className="pt-8">
          <CardTitle className="text-xl leading-relaxed">{question.questionText}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {question.type === 'mcq' && question.options && (
            <RadioGroup 
              value={answers[question._id] || ''} 
              onValueChange={(val) => setAnswers({ ...answers, [question._id]: val })}
              className="space-y-3"
            >
              {question.options.map((opt: string, i: number) => (
                <div key={i} className="flex items-center space-x-3 bg-muted/50 p-4 rounded-lg border hover:bg-muted/80 transition-colors cursor-pointer">
                  <RadioGroupItem value={opt} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`} className="flex-1 cursor-pointer text-base">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type !== 'mcq' && (
            <Textarea 
              placeholder="Type your answer here..."
              className="min-h-[150px] text-base"
              value={answers[question._id] || ''}
              onChange={(e) => setAnswers({ ...answers, [question._id]: e.target.value })}
            />
          )}

          {showHint && question.hint && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-lg flex gap-3 text-sm">
              <Lightbulb className="w-5 h-5 shrink-0" />
              <p>{question.hint}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/20 pt-4">
          <Button variant="outline" onClick={handlePrev} disabled={currentIdx === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          
          <div className="flex gap-2">
            {!showHint && question.hint && (
              <Button variant="ghost" onClick={() => setShowHint(true)}>
                <Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Show Hint
              </Button>
            )}
            <Button onClick={handleNext} disabled={submitting}>
              {currentIdx === quiz.questions.length - 1 ? (
                submitting ? 'Submitting...' : 'Submit Quiz'
              ) : (
                <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
