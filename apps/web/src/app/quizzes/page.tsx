'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { quizzesApi } from '@/lib/quiz';
import { Brain, Plus, Play, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await quizzesApi.getQuizzes();
      setQuizzes(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setGenerating(true);
    try {
      await quizzesApi.generateQuiz({ topicOrDocumentId: topic, count: 5, difficulty: 'medium' });
      setTopic('');
      await loadQuizzes();
    } catch (e) {
      console.error(e);
      alert('Failed to generate quiz. Make sure the topic is in your uploaded documents.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await quizzesApi.deleteQuiz(id);
      await loadQuizzes();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container py-10 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            AI Quizzes
          </h1>
          <p className="text-muted-foreground mt-1">Generate and take quizzes based on your course material.</p>
        </div>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>Generate New Quiz</CardTitle>
          <CardDescription>Enter a topic or concept from your uploaded documents</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            placeholder="e.g. Backpropagation in Neural Networks" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={generating}
            className="max-w-md bg-background"
          />
          <Button onClick={handleGenerate} disabled={generating || !topic}>
            {generating ? 'Generating...' : <><Plus className="w-4 h-4 mr-2" /> Generate Quiz</>}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No quizzes generated yet. Enter a topic above to create one!</p>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2">{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.questions.length} Questions • {quiz.difficulty}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">Generated on {new Date(quiz.createdAt).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter className="flex justify-between gap-2 border-t pt-4">
                <Button variant="ghost" size="icon" onClick={() => handleDelete(quiz._id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                <Link href={`/quizzes/${quiz._id}`} className="flex-1">
                  <Button className="w-full">
                    <Play className="w-4 h-4 mr-2" /> Start Quiz
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
