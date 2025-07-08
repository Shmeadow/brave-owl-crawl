"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Timer, BarChart2 } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { GoalData } from '@/hooks/use-goals';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
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
  const timeToComplete = goal.completed && goal.completed_at
    ? formatDistanceToNowStrict(new Date(goal.created_at), {
        addSuffix: false,
        unit: 'day',
        roundingMethod: 'ceil'
      })
    : 'In Progress';

  return (
    <Card className="bg-card/30 border-t-0 rounded-t-none -mt-1">
      <CardContent className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <StatCard
            icon={Calendar}
            label="Start Date"
            value={format(new Date(goal.created_at), 'MMM d, yyyy')}
            color="text-blue-500"
          />
          <StatCard
            icon={Timer}
            label="Time to Complete"
            value={timeToComplete}
            color="text-green-500"
          />
          <StatCard
            icon={BarChart2}
            label="Productivity Score"
            value="N/A"
            color="text-purple-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}