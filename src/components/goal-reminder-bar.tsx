"use client";

import React, { useState, useEffect } from "react";
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const REMINDER_VISIBILITY_KEY = 'goal_reminder_visible';

export function GoalReminderBar() {
  const { goals, loading, handleToggleComplete, handleDeleteGoal } = useGoals();
  // Initialize isVisible from local storage, default to true if not found
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedVisibility = localStorage.getItem(REMINDER_VISIBILITY_KEY);
      return storedVisibility === null ? true : JSON.parse(storedVisibility);
    }
    return true; // Default to true on server-side render
  });

  // Update local storage whenever isVisible changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REMINDER_VISIBILITY_KEY, JSON.stringify(isVisible));
    }
  }, [isVisible]);

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
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-5 w-5"
              onClick={() => setIsVisible(false)}
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