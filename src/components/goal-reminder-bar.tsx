"use client";

import React, { useState } from "react";
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoalReminderBar() {
  const { goals, loading, handleToggleComplete, handleDeleteGoal } = useGoals();
  const [isVisible, setIsVisible] = useState(true); // New state for visibility

  // Find the first incomplete goal
  const activeGoal = goals.find(goal => !goal.completed);

  // Only render if not loading, is visible, and an active goal exists
  if (loading || !activeGoal || !isVisible) {
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
          <div className="flex items-center gap-1"> {/* Group delete and close buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-5 w-5"
              onClick={() => handleDeleteGoal(activeGoal.id)}
            >
              <X className="h-3 w-3" /> {/* Reusing X icon for delete for now, can be changed to Trash2 if preferred */}
              <span className="sr-only">Delete Goal</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-5 w-5"
              onClick={() => setIsVisible(false)} // Hide the bar when this X is clicked
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Close Reminder</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}