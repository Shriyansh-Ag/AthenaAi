'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { plannerApi } from '@/lib/planner';

interface GeneratePlanModalProps {
  onPlanGenerated: () => void;
  trigger?: React.ReactNode;
}

export function GeneratePlanModal({ onPlanGenerated, trigger }: GeneratePlanModalProps) {
  const [open, setOpen] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [hours, setHours] = useState('');
  const [weakTopics, setWeakTopics] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!examDate || !hours) return;
    setLoading(true);
    try {
      await plannerApi.generatePlan({
        examDate,
        availableHoursPerWeek: parseInt(hours),
        weakTopics: weakTopics.split(',').map(t => t.trim()).filter(Boolean)
      });
      setOpen(false);
      onPlanGenerated();
    } catch (e) {
      console.error(e);
      alert('Failed to generate study plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Generate New Plan</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Study Schedule</DialogTitle>
          <DialogDescription>
            Enter your constraints and AthenaAI will build a day-by-day plan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="examDate" className="text-right">Exam Date</Label>
            <Input 
              id="examDate" 
              type="date" 
              className="col-span-3" 
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hours" className="text-right">Hours/Week</Label>
            <Input 
              id="hours" 
              type="number" 
              placeholder="e.g. 10" 
              className="col-span-3"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topics" className="text-right">Weak Topics</Label>
            <Input 
              id="topics" 
              placeholder="Comma separated" 
              className="col-span-3"
              value={weakTopics}
              onChange={(e) => setWeakTopics(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={loading || !examDate || !hours}>
            {loading ? 'Generating...' : 'Create Plan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
