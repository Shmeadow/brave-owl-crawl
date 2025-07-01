"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGoalForm } from "@/components/add-goal-form";
import { GoalList } from "@/components/goal-list";
import { useGoals } from "@/hooks/use-goals";

export function GoalFocusPanel() {
  const { goals, loading, isLoggedInMode, handleAddGoal, handleToggleComplete, handleDeleteGoal } = useGoals();

  if (loading) {
    return (
      <div className="bg-card/80 backdrop-blur-md p-4 h-full w-full rounded-lg flex flex-col items-center justify-center">
        <p className="text-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-md p-4 h-full w-full rounded-lg">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto py-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Add New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <AddGoalForm onAddGoal={handleAddGoal} />
          </CardContent>
        </Card>

        <GoalList
          goals={goals}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteGoal}
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