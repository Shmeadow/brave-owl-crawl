"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGoalForm } from "@/components/add-goal-form";
import { GoalList } from "@/components/goal-list";
import { useGoals } from "@/hooks/use-goals";
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

export function GoalFocusDashboard() {
  const { goals, loading, isLoggedInMode, handleAddGoal, handleToggleComplete, handleDeleteGoal } = useGoals();
  const { isCurrentRoomWritable } = useCurrentRoom(); // Get writability status

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <p className="text-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full">
      <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20">
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
  );
}