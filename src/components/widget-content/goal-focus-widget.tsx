"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGoalForm } from "@/components/add-goal-form";
import { GoalList } from "@/components/goal-list";
import { useGoals } from "@/hooks/use-goals";

interface GoalFocusWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function GoalFocusWidget({ isCurrentRoomWritable }: GoalFocusWidgetProps) {
  const { goals, loading, isLoggedInMode, handleAddGoal, handleToggleComplete, handleDeleteGoal } = useGoals();

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
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