'use client';

import React, { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrainCircuit, Clock, Target, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await analyticsApi.getDashboardData();
      setData(res.data);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Analytics...</div>;

  if (!data) {
    return (
      <div className="container max-w-4xl mx-auto py-20 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl font-bold">Learning Analytics</h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          No data available yet. Start completing quizzes and study tasks to track your performance.
        </p>
      </div>
    );
  }

  const { summary, accuracyTimeline, topics } = data;

  const totalStudyHours = (summary.totalStudyTimeMs / (1000 * 60 * 60)).toFixed(1);

  return (
    <div className="container max-w-6xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-primary" />
          Performance Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track your mastery, retention, and study velocity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Overall Mastery</p>
            <h2 className="text-4xl font-bold">{summary.overallMastery}%</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Avg Quiz Accuracy</p>
            <h2 className="text-4xl font-bold">{summary.averageQuizAccuracy}%</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Total Study Time</p>
            <h2 className="text-4xl font-bold">{totalStudyHours}h</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Tasks Completed</p>
            <h2 className="text-4xl font-bold">{summary.completedTasksCount}</h2>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Accuracy Timeline (Custom Bar Chart) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Learning Velocity & Accuracy</CardTitle>
            <CardDescription>Your quiz score percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            {accuracyTimeline && accuracyTimeline.length > 0 ? (
              <div className="h-64 flex items-end gap-2 mt-4 relative">
                {/* Y-axis grid lines mock */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                  <div className="border-t border-primary w-full h-0"></div>
                  <div className="border-t border-primary w-full h-0"></div>
                  <div className="border-t border-primary w-full h-0"></div>
                  <div className="border-t border-primary w-full h-0"></div>
                </div>
                
                {accuracyTimeline.map((item: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div 
                      className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-sm relative flex items-end justify-center"
                      style={{ height: `${Math.max(item.scorePercentage, 5)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap transition-opacity">
                        {item.scorePercentage.toFixed(0)}%
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground -rotate-45 origin-top-left mt-2 truncate w-full block text-center">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Not enough quiz data to generate timeline.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="w-5 h-5" /> Strong Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topics.strong.map((topic: string, i: number) => (
                  <span key={i} className="bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/20">
                    {topic}
                  </span>
                ))}
                {topics.strong.length === 0 && <span className="text-sm text-muted-foreground">None identified yet.</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Weak Topics (Needs Review)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topics.weak.map((topic: string, i: number) => (
                  <span key={i} className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium border border-destructive/20">
                    {topic}
                  </span>
                ))}
                {topics.weak.length === 0 && <span className="text-sm text-muted-foreground">None identified yet.</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
