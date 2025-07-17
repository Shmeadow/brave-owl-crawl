"use client";

import React, { useState } from "react";
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
  const { goals, loading, isLoggedInMode, handleAddGoal, handleToggleComplete, handleUpdateGoal, handleDeleteGoal } = useGoals();
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

  // Default to 'manage' view
  return (
    <div className="h-full w-full flex flex-col items-center gap-4 p-2 sm:p-4">
      {view === 'manage' && hasIncompleteGoals && (
         <div className="text-center">
           <Button variant="link" onClick={() => setView('kickoff')}>
             Back to Focus Kick-off
           </Button>
         </div>
      )}
      <h2 className="text-xl font-semibold text-foreground">Manage Your Goals</h2>
      <div className="w-full max-w-lg">
        <AddGoalForm onAddGoal={handleAddGoal} isCurrentRoomWritable={isCurrentRoomWritable} />
      </div>
      <div className="w-full max-w-lg flex-1 min-h-0">
        <GoalList
          goals={goals}
          onToggleComplete={handleToggleComplete}
          onUpdateGoal={handleUpdateGoal}
          onDelete={handleDeleteGoal}
          isCurrentRoomWritable={isCurrentRoomWritable}
        />
      </div>
      {!isLoggedInMode && (
        <p className="text-sm text-muted-foreground mt-2 text-center">
          You are currently browsing as a guest. Your goals are saved locally. Log in to save them to your account!
        </p>
      )}
    </div>
  );
}