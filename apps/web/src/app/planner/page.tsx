'use client';

import React, { useEffect, useState } from 'react';
import { plannerApi } from '@/lib/planner';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIcon, Target, BookOpen } from 'lucide-react';
import { GeneratePlanModal } from '@/components/features/planner/GeneratePlanModal';
import { TaskCard } from '@/components/features/planner/TaskCard';

export default function PlannerPage() {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const res = await plannerApi.getActivePlan();
      setPlan(res.data);
    } catch (e) {
      console.error(e);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Study Plan...</div>;

  if (!plan) {
    return (
      <div className="container max-w-4xl mx-auto py-20 flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <CalendarIcon className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold">Personalized Study Schedule</h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Generate an AI-powered day-by-day study plan tailored to your exam date, available hours, and weak topics.
        </p>
        <GeneratePlanModal onPlanGenerated={loadPlan} />
      </div>
    );
  }

  // Group tasks by date
  const tasksByDate = plan.dailyTasks.reduce((acc: any, task: any) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  const dates = Object.keys(tasksByDate).sort();

  return (
    <div className="container max-w-6xl mx-auto py-10 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-primary" />
            Study Schedule
          </h1>
          <p className="text-muted-foreground mt-1">Exam Date: {new Date(plan.examDate).toLocaleDateString()}</p>
        </div>
        <GeneratePlanModal onPlanGenerated={loadPlan} trigger={<Button variant="outline">Re-generate Plan</Button>} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="pt-6">
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-lg">Overall Progress</span>
              <span className="font-bold text-primary">{plan.progressPercentage}%</span>
            </div>
            <Progress value={plan.progressPercentage} className="h-3" />
            
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Hours / Week</p>
                <p className="text-2xl font-bold">{plan.availableHoursPerWeek}</p>
              </div>
              <div className="flex-1 bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{plan.dailyTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {plan.weakTopics.map((topic: string, i: number) => (
                <span key={i} className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium">
                  {topic}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
        {/* Milestones Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Milestones
          </h3>
          <div className="space-y-3">
            {plan.milestones.map((m: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border-l-4 ${m.completed ? 'border-green-500 bg-green-500/5' : 'border-primary bg-primary/5'}`}>
                <p className={`font-semibold ${m.completed ? 'line-through text-muted-foreground' : ''}`}>{m.name}</p>
                <p className="text-xs text-muted-foreground mt-1">By {new Date(m.targetDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline / Daily Tasks */}
        <div className="lg:col-span-3 space-y-8">
          {dates.map((date: string) => {
            const isPast = new Date(date) < new Date(new Date().setHours(0,0,0,0));
            const isToday = date === new Date().toISOString().split('T')[0];

            return (
              <div key={date} className={`relative pl-6 border-l-2 ${isPast ? 'border-muted' : 'border-primary/30'}`}>
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${isToday ? 'bg-primary ring-4 ring-primary/20' : isPast ? 'bg-muted' : 'bg-background border-2 border-primary/30'}`} />
                <h3 className={`font-bold text-lg mb-4 flex items-center gap-3 ${isToday ? 'text-primary' : ''}`}>
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  {isToday && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasksByDate[date].map((task: any) => (
                    <TaskCard key={task._id} planId={plan._id} task={task} onStatusChange={loadPlan} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
