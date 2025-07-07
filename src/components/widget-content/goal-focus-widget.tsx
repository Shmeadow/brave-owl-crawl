"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGoalForm } from "@/components/add-goal-form";
import { GoalList } from "@/components/goal-list";
import { useGoals } from "@/hooks/use-goals";
import { PersonalizedKickoff } from "@/components/personalized-kickoff";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GoalFocusWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function GoalFocusWidget({ isCurrentRoomWritable }: GoalFocusWidgetProps) {
  const { goals, loading, isLoggedInMode, handleAddGoal, handleToggleComplete, handleDeleteGoal } = useGoals();
  const [view, setView] = useState<'kickoff' | 'manage'>('kickoff');

  const hasIncompleteGoals = goals.some(g => !g.completed);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-foreground mt-2">Loading goals...</p>
      </div>
    );
  }

  if (view === 'kickoff' && hasIncompleteGoals) {
    return (
      <div className="h-full w-full flex flex-col">
        <PersonalizedKickoff />
        <div className="text-center p-4 mt-auto">
          <Button variant="link" onClick={() => setView('manage')}>
            Manage All Goals
          </Button>
        </div>
      </div>
    );
  }

  // Default to 'manage' view if no incomplete goals or if view is set to 'manage'
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        {view === 'manage' && hasIncompleteGoals && (
           <div className="text-center">
             <Button variant="link" onClick={() => setView('kickoff')}>
               Back to Focus Kick-off
             </Button>
           </div>
        )}
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle>Add New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <AddGoalForm onAddGoal={handleAddGoal} isCurrentRoomWritable={isCurrentRoomWritable} />
          </CardContent>
        </Card>

        <GoalList
          goals={goals}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteGoal}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />

        {!isLoggedInMode && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You are currently browsing as a guest. Your goals are saved locally in your browser. Log in to save them to your account!
          </p>
        )}
      </div>
    </div>
  );
}