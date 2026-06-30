'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { plannerApi } from '@/lib/planner';

interface TaskCardProps {
  planId: string;
  task: any;
  onStatusChange: () => void;
}

export function TaskCard({ planId, task, onStatusChange }: TaskCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (status: 'completed' | 'missed' | 'pending') => {
    if (task.status === status || loading) return;
    setLoading(true);
    try {
      await plannerApi.updateTaskStatus(planId, task._id, status);
      onStatusChange();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = task.status === 'completed';
  const isMissed = task.status === 'missed';

  return (
    <Card className={`overflow-hidden transition-all ${isCompleted ? 'bg-muted/50 opacity-80' : ''}`}>
      <CardContent className="p-4 flex items-start gap-4">
        <button 
          onClick={() => handleStatusUpdate(isCompleted ? 'pending' : 'completed')}
          disabled={loading}
          className="mt-1"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : isMissed ? (
            <XCircle className="w-6 h-6 text-destructive" />
          ) : (
            <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        <div className="flex-1 space-y-1">
          <h4 className={`font-semibold ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {task.topic}
          </h4>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          <div className="flex items-center gap-2 text-xs font-medium text-primary mt-2">
            <Clock className="w-3 h-3" />
            {task.estimatedMinutes} mins
          </div>
        </div>
        {!isCompleted && !isMissed && (
          <Button variant="ghost" size="sm" onClick={() => handleStatusUpdate('missed')} disabled={loading}>
            Skip
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
