"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Timer, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import { format, formatDistanceToNowStrict, isPast, isToday, differenceInDays } from 'date-fns';
import { GoalData } from '@/hooks/use-goals';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center p-3 bg-muted/50 rounded-lg">
    <Icon className={`h-6 w-6 mr-3 ${color}`} />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  </div>
);

interface GoalStatsProps {
  goal: GoalData;
}

export function GoalStats({ goal }: GoalStatsProps) {
  const now = new Date();
  const createdDate = new Date(goal.created_at);
  const targetDate = goal.target_completion_date ? new Date(goal.target_completion_date) : null;

  const timeToComplete = goal.completed && goal.completed_at
    ? formatDistanceToNowStrict(new Date(goal.created_at), {
        addSuffix: false,
        unit: 'day',
        roundingMethod: 'ceil'
      }) + ' to complete'
    : 'In Progress';

  const getProductivityScore = () => {
    if (goal.completed) {
      return <span className="text-green-500 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Completed</span>;
    }
    if (!targetDate) {
      return <span className="text-muted-foreground">No Due Date</span>;
    }

    const daysRemaining = differenceInDays(targetDate, now);

    if (isPast(targetDate) && !isToday(targetDate)) {
      return <span className="text-red-500 flex items-center gap-1"><XCircle className="h-4 w-4" /> Overdue</span>;
    }
    if (isToday(targetDate)) {
      return <span className="text-orange-500">Due Today!</span>;
    }
    if (daysRemaining <= 3) {
      return <span className="text-orange-500">Critical ({daysRemaining} days)</span>;
    }
    if (daysRemaining <= 7) {
      return <span className="text-yellow-500">Approaching ({daysRemaining} days)</span>;
    }
    return <span className="text-blue-500">On Track</span>;
  };

  return (
    <Card className="bg-card/30 border-t-0 rounded-t-none -mt-1">
      <CardContent className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <StatCard
            icon={Calendar}
            label="Created On"
            value={format(createdDate, 'MMM d, yyyy')}
            color="text-blue-500"
          />
          <StatCard
            icon={Timer}
            label="Target Date"
            value={targetDate ? format(targetDate, 'MMM d, yyyy') : 'N/A'}
            color="text-purple-500"
          />
          <StatCard
            icon={BarChart2}
            label="Status"
            value={getProductivityScore()}
            color="text-green-500"
          />
        </div>
        {goal.description && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Description:</p>
            <p>{goal.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}