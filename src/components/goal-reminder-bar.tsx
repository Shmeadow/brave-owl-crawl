"use client";

import React from "react"; // Removed useState, useEffect as isVisible state is no longer needed for user dismissal
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react"; // Removed X icon
import { cn } from "@/lib/utils";

// REMOVED: REMINDER_VISIBILITY_KEY and associated local storage logic

export function GoalReminderBar() {
  const { goals, loading, handleToggleComplete, handleDeleteGoal } = useGoals();

  // Find the first incomplete goal
  const activeGoal = goals.find(goal => !goal.completed);

  // Only render if not loading and an active goal exists
  // The bar will now always be visible if there's an incomplete goal.
  if (loading || !activeGoal) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 z-50 w-full max-w-xs">
      <Card className="bg-transparent shadow-none border-none">
        <CardContent className="flex items-center justify-between p-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
              id={`reminder-goal-${activeGoal.id}`}
              checked={activeGoal.completed}
              onCheckedChange={() => handleToggleComplete(activeGoal.id, activeGoal.completed)}
              className="h-4 w-4"
            />
            <label
              htmlFor={`reminder-goal-${activeGoal.id}`}
              className={cn(
                "text-sm font-medium leading-none truncate",
                activeGoal.completed && "line-through text-muted-foreground"
              )}
            >
              {activeGoal.title}
            </label>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-5 w-5"
              onClick={() => handleDeleteGoal(activeGoal.id)}
            >
              <Trash2 className="h-3 w-3" />
              <span className="sr-only">Delete Goal</span>
            </Button>
            {/* REMOVED: The X button for closing the reminder bar */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}