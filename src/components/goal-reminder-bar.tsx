"use client";

import React from "react";
import { useGoals } from "@/hooks/use-goals";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoalReminderBar() {
  const { goals, loading, handleToggleComplete, handleDeleteGoal } = useGoals();

  // Find the first incomplete goal
  const activeGoal = goals.find(goal => !goal.completed);

  if (loading || !activeGoal) {
    return null; // Don't render if loading or no active goals
  }

  return (
    <div className="fixed top-16 left-4 z-50 w-full max-w-xs"> {/* Adjusted positioning and max-width */}
      <Card className="bg-transparent shadow-none border-none"> {/* Made card transparent, no shadow/border */}
        <CardContent className="flex items-center justify-between p-2 gap-2"> {/* Reduced padding */}
          <div className="flex items-center gap-2 flex-1 min-w-0"> {/* Reduced gap */}
            <Checkbox
              id={`reminder-goal-${activeGoal.id}`}
              checked={activeGoal.completed}
              onCheckedChange={() => handleToggleComplete(activeGoal.id, activeGoal.completed)}
              className="h-4 w-4" // Smaller checkbox
            />
            <label
              htmlFor={`reminder-goal-${activeGoal.id}`}
              className={cn(
                "text-sm font-medium leading-none truncate", // Smaller text
                activeGoal.completed && "line-through text-muted-foreground"
              )}
            >
              {activeGoal.title}
            </label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-5 w-5" // Smaller button
            onClick={() => handleDeleteGoal(activeGoal.id)}
          >
            <X className="h-3 w-3" /> {/* Smaller icon */}
            <span className="sr-only">Delete Goal</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}